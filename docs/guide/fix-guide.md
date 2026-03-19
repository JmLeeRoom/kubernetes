# MLOps Platform 수정 가이드

> 코드 분석을 통해 발견된 문제점과 수정 방법을 정리한 문서입니다.

---

## 목차

1. [보안 문제](#1-보안-문제)
2. [인증 및 권한 문제](#2-인증-및-권한-문제)
3. [에러 처리 문제](#3-에러-처리-문제)
4. [설정 및 구성 문제](#4-설정-및-구성-문제)
5. [프론트엔드 문제](#5-프론트엔드-문제)
6. [테스트 부족 문제](#6-테스트-부족-문제)
7. [인프라 및 배포 문제](#7-인프라-및-배포-문제)

---

## 1. 보안 문제

### 1.1 하드코딩된 기본 비밀번호

**위치:**
- `packages/backend/pipeline_svc/config.py` — Airbyte 비밀번호 `"password"`
- `packages/backend/mlops_svc/config.py` — Airflow 비밀번호 `"airflow"`

**문제:** 기본 비밀번호가 코드에 직접 하드코딩되어 있어, 실수로 프로덕션에 그대로 배포될 위험이 있습니다.

**수정 방법:**

```python
# pipeline_svc/config.py — 수정 전
PIPELINE_AIRBYTE_PASSWORD: str = "password"

# pipeline_svc/config.py — 수정 후
PIPELINE_AIRBYTE_PASSWORD: str  # 기본값 제거, 환경변수 필수 입력
```

```python
# mlops_svc/config.py — 수정 전
MLOPS_AIRFLOW_PASSWORD: str = "airflow"

# mlops_svc/config.py — 수정 후
MLOPS_AIRFLOW_PASSWORD: str  # 기본값 제거, 환경변수 필수 입력
```

추가로 Kubernetes 배포 시 `Secret` 리소스를 사용하여 민감 정보를 관리해야 합니다:

```yaml
# charts/mlops-platform/templates/pipeline-svc/secret.yaml (신규 생성)
apiVersion: v1
kind: Secret
metadata:
  name: pipeline-svc-secrets
type: Opaque
stringData:
  PIPELINE_AIRBYTE_PASSWORD: "{{ .Values.pipelineSvc.airbyte.password }}"
```

### 1.2 요청 본문 크기 제한 없음

**위치:** `packages/backend/api_gateway/main.py`

**문제:** 요청 크기 제한이 없어 대용량 요청으로 인한 서비스 거부(DoS) 공격에 취약합니다.

**수정 방법:**

```python
# api_gateway/main.py에 미들웨어 추가
from starlette.middleware.trustedhost import TrustedHostMiddleware

# Content-Length 기반 크기 제한 미들웨어 추가
class RequestSizeLimitMiddleware:
    def __init__(self, app, max_content_length: int = 10 * 1024 * 1024):  # 10MB
        self.app = app
        self.max_content_length = max_content_length

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers", []))
            content_length = headers.get(b"content-length")
            if content_length and int(content_length) > self.max_content_length:
                response = JSONResponse(
                    status_code=413,
                    content={"detail": "Request entity too large"},
                )
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)

app.add_middleware(RequestSizeLimitMiddleware, max_content_length=10 * 1024 * 1024)
```

---

## 2. 인증 및 권한 문제

### 2.1 JWKS 캐시에 TTL 없음

**위치:** `packages/backend/shared/auth.py` — `_get_jwks()` 함수

**문제:** `@lru_cache`를 사용하여 JWKS를 캐싱하지만, TTL이 없어 Keycloak에서 키를 교체(rotation)해도 프로세스를 재시작하기 전까지 새 키를 가져오지 못합니다.

**수정 방법:**

```python
# 수정 전
from functools import lru_cache

@lru_cache
def _get_jwks():
    ...

# 수정 후: TTL 기반 캐시로 변경
import time

_jwks_cache = None
_jwks_cache_time = 0
JWKS_CACHE_TTL = 300  # 5분

def _get_jwks():
    global _jwks_cache, _jwks_cache_time
    now = time.monotonic()
    if _jwks_cache is not None and (now - _jwks_cache_time) < JWKS_CACHE_TTL:
        return _jwks_cache

    jwks_url = f"{settings.keycloak_url}/realms/{settings.realm}/protocol/openid-connect/certs"
    response = httpx.get(jwks_url, timeout=10)
    response.raise_for_status()
    _jwks_cache = response.json()
    _jwks_cache_time = now
    return _jwks_cache
```

### 2.2 너무 광범위한 예외 처리 (인증 모듈)

**위치:** `packages/backend/shared/auth.py` — 112-114번째 줄 부근

**문제:** 모든 예외를 catch하여 viewer 역할을 반환합니다. 이로 인해 인증 오류가 조용히 무시되어, 인증되지 않은 사용자가 viewer 권한으로 접근할 수 있습니다.

**수정 방법:**

```python
# 수정 전
except Exception:
    return User(sub="anonymous", role="viewer", groups=[])

# 수정 후: 구체적인 예외만 처리
from jose import JWTError, ExpiredSignatureError

except ExpiredSignatureError:
    raise UnauthorizedError("Token has expired")
except JWTError as e:
    logger.warning("jwt_verification_failed", error=str(e))
    raise UnauthorizedError("Invalid token")
except httpx.HTTPError as e:
    logger.error("keycloak_connection_failed", error=str(e))
    raise UpstreamError("Authentication service unavailable")
```

### 2.3 에러 메시지의 구현 세부 정보 노출

**위치:** `packages/backend/shared/auth.py` — "Unknown signing key" 에러 메시지

**문제:** 내부 구현 정보가 클라이언트에 노출됩니다.

**수정 방법:**

```python
# 수정 전
raise UnauthorizedError("Unknown signing key")

# 수정 후
raise UnauthorizedError("Token validation failed")
```

---

## 3. 에러 처리 문제

### 3.1 Rate Limiter가 Redis 장애 시 조용히 실패

**위치:** `packages/backend/api_gateway/middleware/rate_limit.py` — 39번째 줄

**문제:** `except RuntimeError: pass`로 인해 Redis 연결이 끊겨도 요청 제한이 완전히 비활성화됩니다. 로깅도 없어서 운영팀이 이를 인지하기 어렵습니다.

**수정 방법:**

```python
# 수정 전
except RuntimeError:
    pass

# 수정 후
except RuntimeError:
    logger.warning(
        "rate_limiter_disabled",
        reason="Redis unavailable, rate limiting bypassed",
        client_ip=client_ip,
    )
    # 선택사항: Redis 장애 시 요청을 차단할지 허용할지 정책 결정
    # 허용 정책 (현재): pass
    # 차단 정책: raise HTTPException(status_code=503, detail="Service temporarily unavailable")
```

### 3.2 Prometheus/Loki 클라이언트의 응답 검증 부재

**위치:**
- `packages/backend/monitoring_svc/clients/prometheus.py`
- `packages/backend/monitoring_svc/clients/loki.py`

**문제:** 외부 API 응답 구조를 검증하지 않고 바로 접근하여, 예상치 못한 응답 형식에서 `KeyError`가 발생할 수 있습니다.

**수정 방법:**

```python
# 수정 전
data = response.json()
return data["data"]["result"]

# 수정 후
data = response.json()
if data.get("status") != "success":
    raise UpstreamError(
        f"Prometheus query failed: {data.get('error', 'unknown error')}"
    )
result = data.get("data", {}).get("result")
if result is None:
    raise UpstreamError("Unexpected Prometheus response format")
return result
```

### 3.3 KServe 클라이언트의 문자열 매칭 기반 예외 처리

**위치:** `packages/backend/serving_svc/clients/kserve.py`

**문제:** `"404" in str(exc)`와 같은 문자열 매칭은 불안정하며, 다른 에러 메시지에 "404"가 포함된 경우 잘못 처리될 수 있습니다.

**수정 방법:**

```python
# 수정 전
except ApiException as exc:
    if "404" in str(exc):
        raise NotFoundError(f"InferenceService '{name}' not found")
    raise

# 수정 후
from kubernetes.client.exceptions import ApiException

except ApiException as exc:
    if exc.status == 404:
        raise NotFoundError(f"InferenceService '{name}' not found")
    raise UpstreamError(f"KServe API error: {exc.status}")
```

### 3.4 KServe 클라이언트가 요청마다 새로 생성됨

**위치:** `packages/backend/serving_svc/clients/kserve.py`

**문제:** 요청마다 Kubernetes 클라이언트를 새로 생성하여 불필요한 오버헤드가 발생합니다.

**수정 방법:**

```python
# serving_svc/main.py의 lifespan에서 클라이언트를 초기화
from contextlib import asynccontextmanager

_kserve_client: KServeClient | None = None

def get_kserve_client() -> KServeClient:
    if _kserve_client is None:
        raise RuntimeError("KServe client not initialized")
    return _kserve_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _kserve_client
    _kserve_client = KServeClient(namespace=settings.kserve_namespace)
    yield
    _kserve_client = None
```

### 3.5 canary_percent 값 검증 누락

**위치:** `packages/backend/serving_svc/routers/inference.py`

**문제:** canary 트래픽 비율에 대한 0-100 범위 검증이 없습니다.

**수정 방법:**

```python
# Pydantic 모델에 검증 추가
from pydantic import BaseModel, Field

class TrafficUpdateRequest(BaseModel):
    canary_percent: int = Field(..., ge=0, le=100, description="카나리 트래픽 비율 (0-100)")
```

---

## 4. 설정 및 구성 문제

### 4.1 Redis 초기화 시 재시도 로직 없음

**위치:** `packages/backend/shared/cache.py`

**문제:** Redis 연결 실패 시 한 번 경고만 하고 넘어갑니다. 서비스 시작 시 Redis가 아직 준비되지 않은 경우 캐시 없이 동작합니다.

**수정 방법:**

```python
import asyncio

async def init_redis(url: str, max_retries: int = 3, retry_delay: float = 2.0):
    global _redis
    for attempt in range(max_retries):
        try:
            _redis = aioredis.from_url(url, decode_responses=True)
            await _redis.ping()
            logger.info("redis_connected", url=url)
            return
        except Exception as e:
            logger.warning(
                "redis_connection_failed",
                attempt=attempt + 1,
                max_retries=max_retries,
                error=str(e),
            )
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay * (attempt + 1))

    logger.error("redis_init_failed", message="All retry attempts exhausted")
```

### 4.2 Redis 연결 풀 설정 누락

**위치:** `packages/backend/shared/cache.py`

**문제:** 기본 연결 풀 설정을 사용하므로, 높은 부하에서 연결 부족이 발생할 수 있습니다.

**수정 방법:**

```python
# 수정 전
_redis = aioredis.from_url(url, decode_responses=True)

# 수정 후
_redis = aioredis.from_url(
    url,
    decode_responses=True,
    max_connections=20,
    socket_timeout=5,
    socket_connect_timeout=5,
    retry_on_timeout=True,
)
```

### 4.3 JSON 직렬화에서 복잡한 타입 미지원

**위치:** `packages/backend/shared/cache.py` — `cache_set()` 함수

**문제:** `datetime` 등 JSON 기본 직렬화가 안 되는 타입을 캐싱할 수 없습니다.

**수정 방법:**

```python
import json
from datetime import datetime, date

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

async def cache_set(key: str, value: Any, ttl: int = 10):
    redis = get_redis()
    await redis.setex(key, ttl, json.dumps(value, cls=CustomJSONEncoder))
```

---

## 5. 프론트엔드 문제

### 5.1 토큰 갱신 시 전역 변수 사용

**위치:** `packages/frontend/src/lib/api.ts`

**문제:** `isRefreshing`과 `failedQueue`가 전역 변수로 관리되어, 여러 Axios 인스턴스를 사용할 경우 상태 충돌이 발생할 수 있습니다.

**수정 방법:**

```typescript
// 수정: 클로저로 캡슐화
function createApiClient() {
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }> = [];

  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  // interceptor 설정을 이 클로저 안에서 수행
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      // isRefreshing, failedQueue를 클로저 내부 변수로 사용
      // ... 기존 로직
    }
  );

  return client;
}

export const api = createApiClient();
```

### 5.2 토큰 갱신 엔드포인트에 타임아웃 없음

**위치:** `packages/frontend/src/lib/api.ts`

**문제:** 토큰 갱신 요청이 무한히 대기할 수 있습니다.

**수정 방법:**

```typescript
// 토큰 갱신 시 별도 타임아웃 설정
const refreshResponse = await axios.post(
  '/api/v1/auth/refresh',
  { refresh_token: refreshToken },
  { timeout: 10_000 }  // 10초 타임아웃
);
```

### 5.3 WebSocket 로그 스트림의 재연결 로직 없음

**위치:** 프론트엔드 로그 뷰어 관련 코드

**문제:** WebSocket 연결이 끊어졌을 때 자동 재연결이 없습니다.

**수정 방법:**

```typescript
function useWebSocketWithReconnect(url: string, maxRetries = 5) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    const socket = new WebSocket(url);

    socket.onclose = (event) => {
      if (!event.wasClean && retryCount.current < maxRetries) {
        const delay = Math.min(1000 * 2 ** retryCount.current, 30000);
        retryCount.current += 1;
        setTimeout(connect, delay);
      }
    };

    socket.onopen = () => {
      retryCount.current = 0;
    };

    setWs(socket);
  }, [url, maxRetries]);

  useEffect(() => {
    connect();
    return () => ws?.close();
  }, [connect]);

  return ws;
}
```

---

## 6. 테스트 부족 문제

### 6.1 인증 플로우 E2E 테스트 없음

**위치:** `e2e/` 디렉토리

**문제:** E2E 테스트에서 인증 플로우(로그인, 토큰 갱신, 로그아웃)에 대한 테스트가 없습니다.

**수정 방법:**

```typescript
// e2e/auth.spec.ts (신규)
import { test, expect } from '@playwright/test';

test.describe('인증 플로우', () => {
  test('로그인 성공', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'admin@company.com');
    await page.fill('[data-testid=password]', 'admin-password');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/monitoring/cluster');
  });

  test('잘못된 자격증명으로 로그인 실패', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'admin@company.com');
    await page.fill('[data-testid=password]', 'wrong-password');
    await page.click('[data-testid=login-button]');
    await expect(page.locator('[data-testid=error-message]')).toBeVisible();
  });

  test('토큰 만료 시 자동 갱신', async ({ page }) => {
    // 토큰 만료를 시뮬레이션하고 자동 갱신 확인
  });
});
```

### 6.2 서비스 간 통합 테스트 없음

**문제:** 각 서비스의 단위 테스트는 있지만, API Gateway를 통한 서비스 간 통신을 테스트하는 통합 테스트가 없습니다.

**수정 방법:**

```python
# tests/integration/test_gateway_to_monitoring.py (신규)
import pytest
from httpx import AsyncClient, ASGITransport
from api_gateway.main import app as gateway_app

@pytest.mark.integration
async def test_gateway_forwards_to_monitoring(mock_monitoring_svc):
    """API Gateway가 모니터링 서비스로 요청을 올바르게 프록시하는지 검증"""
    async with AsyncClient(
        transport=ASGITransport(app=gateway_app),
        base_url="http://test",
    ) as client:
        response = await client.get(
            "/api/v1/monitoring/health",
            headers={"Authorization": "Bearer test-token"},
        )
        assert response.status_code == 200
```

### 6.3 프론트엔드 토큰 갱신 테스트 부족

**문제:** 401 응답 시 자동 토큰 갱신 로직에 대한 테스트가 부족합니다.

**수정 방법:**

```typescript
// src/lib/__tests__/api.test.ts (신규 또는 추가)
import { api } from '../api';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

describe('토큰 자동 갱신', () => {
  it('401 응답 시 토큰을 갱신하고 원래 요청을 재시도한다', async () => {
    let callCount = 0;
    server.use(
      http.get('/api/v1/monitoring/metrics', () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json({ data: 'ok' });
      }),
      http.post('/api/v1/auth/refresh', () => {
        return HttpResponse.json({ access_token: 'new-token' });
      }),
    );

    const response = await api.get('/monitoring/metrics');
    expect(response.data).toEqual({ data: 'ok' });
    expect(callCount).toBe(2);
  });
});
```

---

## 7. 인프라 및 배포 문제

### 7.1 Helm Chart에 Secret 리소스 누락

**위치:** `charts/mlops-platform/templates/`

**문제:** 민감한 환경변수(비밀번호, 클라이언트 시크릿)가 ConfigMap에 포함되어 있습니다. ConfigMap은 base64 인코딩만 제공하고 암호화가 없습니다.

**수정 방법:**

```yaml
# charts/mlops-platform/templates/secrets.yaml (신규 생성)
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Release.Name }}-secrets
type: Opaque
stringData:
  GATEWAY_AUTH_CLIENT_SECRET: {{ .Values.global.auth.clientSecret | quote }}
  PIPELINE_AIRBYTE_PASSWORD: {{ .Values.pipelineSvc.airbyte.password | quote }}
  MLOPS_AIRFLOW_PASSWORD: {{ .Values.mlopsSvc.airflow.password | quote }}
```

그리고 Deployment에서 Secret을 참조하도록 수정:

```yaml
# Deployment의 envFrom 섹션에 추가
envFrom:
  - configMapRef:
      name: {{ .Release.Name }}-pipeline-svc-config
  - secretRef:
      name: {{ .Release.Name }}-secrets
```

### 7.2 Health Check의 세부적인 의존성 상태 확인 부재

**위치:** 각 서비스의 `/health` 엔드포인트

**문제:** 현재 health check는 서비스 프로세스가 살아있는지만 확인하며, Redis나 외부 서비스 연결 상태를 포함하지 않습니다.

**수정 방법:**

```python
@app.get("/health")
async def health():
    checks = {"service": "ok"}

    # Redis 상태 확인
    try:
        redis = get_redis()
        await redis.ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "degraded"

    overall = "healthy" if all(v == "ok" for v in checks.values()) else "degraded"

    return {
        "status": overall,
        "service": settings.service_name,
        "version": settings.version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": checks,
    }
```

### 7.3 RBAC ClusterRole 범위가 넓음

**위치:** `charts/mlops-platform/templates/rbac/`

**문제:** ClusterRole은 클러스터 전체에 영향을 미칩니다. 가능하면 Role(네임스페이스 범위)로 제한하는 것이 좋습니다.

**수정 방법:** KServe CRD 접근은 ClusterRole이 필요하지만, 다른 권한은 Role + RoleBinding으로 분리하여 최소 권한 원칙을 적용합니다.

---

## 수정 우선순위

| 우선순위 | 항목 | 영향도 | 난이도 |
|---------|------|--------|--------|
| **P0 (즉시)** | 하드코딩된 비밀번호 제거 (1.1) | 높음 | 낮음 |
| **P0 (즉시)** | 광범위한 예외 처리 수정 (2.2) | 높음 | 낮음 |
| **P1 (이번 스프린트)** | JWKS 캐시 TTL 추가 (2.1) | 높음 | 낮음 |
| **P1 (이번 스프린트)** | Helm Secret 리소스 생성 (7.1) | 높음 | 중간 |
| **P1 (이번 스프린트)** | canary_percent 검증 추가 (3.5) | 중간 | 낮음 |
| **P1 (이번 스프린트)** | KServe 예외 처리 개선 (3.3) | 중간 | 낮음 |
| **P2 (다음 스프린트)** | Rate Limiter 로깅 추가 (3.1) | 중간 | 낮음 |
| **P2 (다음 스프린트)** | Redis 재시도 로직 (4.1) | 중간 | 중간 |
| **P2 (다음 스프린트)** | Prometheus 응답 검증 (3.2) | 중간 | 낮음 |
| **P2 (다음 스프린트)** | 요청 크기 제한 (1.2) | 중간 | 낮음 |
| **P3 (백로그)** | 프론트엔드 토큰 갱신 캡슐화 (5.1) | 낮음 | 중간 |
| **P3 (백로그)** | WebSocket 재연결 (5.3) | 낮음 | 중간 |
| **P3 (백로그)** | 통합/E2E 테스트 보강 (6.x) | 낮음 | 높음 |
| **P3 (백로그)** | Health Check 의존성 상태 (7.2) | 낮음 | 낮음 |
