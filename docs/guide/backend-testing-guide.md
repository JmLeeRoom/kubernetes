# 백엔드 테스트 가이드

> MLOps Platform 백엔드 서비스의 테스트 실행, 작성, 디버깅 방법

---

## 목차

1. [빠른 시작](#1-빠른-시작)
2. [테스트 아키텍처](#2-테스트-아키텍처)
3. [환경 설정](#3-환경-설정)
4. [테스트 실행](#4-테스트-실행)
5. [테스트 구조 및 컨벤션](#5-테스트-구조-및-컨벤션)
6. [테스트 작성 단계별 가이드](#6-테스트-작성-단계별-가이드)
7. [Fixture 레퍼런스](#7-fixture-레퍼런스)
8. [모킹 패턴](#8-모킹-패턴)
9. [커버리지](#9-커버리지)
10. [문제 해결](#10-문제-해결)

---

## 1. 빠른 시작

```bash
cd packages/backend

# 가상환경 생성 및 의존성 설치
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements.dev.txt

# 전체 테스트 실행
pytest tests/ -v

# 특정 서비스 테스트 실행
pytest tests/unit/monitoring/ -v
pytest tests/unit/gateway/ -v
pytest tests/unit/mlops/ -v
pytest tests/unit/pipeline/ -v
pytest tests/unit/serving/ -v
pytest tests/unit/shared/ -v

# 단일 테스트 파일 실행
pytest tests/unit/monitoring/test_metrics_router.py -v

# 단일 테스트 함수 실행
pytest tests/unit/serving/test_inference_router.py::test_create_service -v
```

---

## 2. 테스트 아키텍처

```
packages/backend/
├── tests/
│   ├── conftest.py              # 공유 Fixture (앱, 클라이언트, 모킹)
│   ├── unit/
│   │   ├── gateway/             # API Gateway 테스트
│   │   │   ├── test_health.py
│   │   │   ├── test_auth_router.py
│   │   │   └── test_proxy.py
│   │   ├── monitoring/          # 모니터링 서비스 테스트
│   │   │   ├── test_health.py
│   │   │   ├── test_prometheus.py
│   │   │   ├── test_loki_client.py
│   │   │   ├── test_tempo_client.py
│   │   │   ├── test_k8s.py
│   │   │   ├── test_metrics_router.py
│   │   │   ├── test_logs_router.py
│   │   │   ├── test_traces_router.py
│   │   │   ├── test_k8s_router.py
│   │   │   └── test_alerts_router.py
│   │   ├── mlops/               # MLOps 서비스 테스트
│   │   │   ├── test_health.py
│   │   │   ├── test_mlflow_client.py
│   │   │   ├── test_mlflow_router.py
│   │   │   ├── test_airflow_client.py
│   │   │   └── test_airflow_router.py
│   │   ├── pipeline/            # 파이프라인 서비스 테스트
│   │   │   ├── test_health.py
│   │   │   ├── test_airbyte.py
│   │   │   ├── test_prefect.py
│   │   │   └── test_connections_router.py
│   │   ├── serving/             # 서빙 서비스 테스트
│   │   │   ├── test_health.py
│   │   │   ├── test_kserve.py
│   │   │   └── test_inference_router.py
│   │   └── shared/              # 공유 모듈 테스트
│   │       ├── test_auth.py
│   │       └── test_cache.py
│   └── integration/             # 통합 테스트 (예정)
```

### 테스트 분류

| 분류 | 테스트 대상 | 모킹 수준 |
|------|-----------|----------|
| **클라이언트 테스트** | HTTP 클라이언트 클래스 (MLflow, Airflow, Prometheus 등) | `respx`로 HTTP 모킹 |
| **라우터 테스트** | FastAPI 엔드포인트 로직, 요청/응답 | 클라이언트 팩토리 모킹 |
| **공유 모듈 테스트** | 인증, 캐싱, 예외 처리 | Redis, JWT 모킹 |
| **게이트웨이 테스트** | 프록시 포워딩, 인증 미들웨어, 속도 제한 | 업스트림 + Redis 모킹 |

---

## 3. 환경 설정

### 3.1 사전 요구사항

| 도구 | 최소 버전 | 설치 방법 |
|------|----------|----------|
| Python | 3.11+ | `pyenv install 3.11.9` |
| pip | 최신 | `pip install --upgrade pip` |

### 3.2 의존성 설치

```bash
cd packages/backend

# 가상환경 생성
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows

# 모든 의존성 설치
pip install -r requirements.txt -r requirements.dev.txt
```

### 3.3 주요 테스트 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `pytest` | 8.2.0 | 테스트 러너 |
| `pytest-asyncio` | 0.23.6 | async/await 테스트 지원 |
| `pytest-cov` | 5.0.0 | 커버리지 리포팅 |
| `respx` | 0.21.1 | `httpx` HTTP 호출 모킹 |
| `faker` | 25.0.0 | 테스트 데이터 생성 |

### 3.4 설정 (`pyproject.toml`)

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"         # 모든 async 테스트 자동 실행
testpaths = ["tests"]         # 테스트 탐색 경로
addopts = "-v --tb=short"     # 상세 출력, 짧은 트레이스백
```

> `asyncio_mode = "auto"`이므로 모든 async 테스트에 `@pytest.mark.asyncio`를 붙일 필요가 없지만, 기존 테스트는 명시성을 위해 포함하고 있습니다.

### 3.5 테스트용 인증 우회

`conftest.py`에서 JWT 검증을 자동으로 비활성화합니다:

```python
import os
os.environ.setdefault("AUTH_VERIFY_TOKEN", "false")
```

이 설정으로 인증 미들웨어가 admin 권한의 dev-user를 반환하므로, 테스트에 실제 Keycloak 인스턴스가 필요하지 않습니다.

---

## 4. 테스트 실행

### 4.1 전체 테스트

```bash
# 모든 테스트, 상세 출력
pytest tests/ -v

# 예상 출력:
# ======================== 96 passed, 1 warning in 1.57s =========================
```

### 4.2 서비스별 실행

```bash
# API Gateway (인증, 프록시, 헬스체크)
pytest tests/unit/gateway/ -v

# 모니터링 (Prometheus, Loki, Tempo, K8s, 알림)
pytest tests/unit/monitoring/ -v

# MLOps (MLflow, Airflow)
pytest tests/unit/mlops/ -v

# 파이프라인 (Airbyte, Prefect, Spark)
pytest tests/unit/pipeline/ -v

# 서빙 (KServe, 추론)
pytest tests/unit/serving/ -v

# 공유 모듈 (인증, 캐시)
pytest tests/unit/shared/ -v
```

### 4.3 커버리지 포함

```bash
# 터미널 커버리지 리포트
pytest tests/ --cov=. --cov-report=term-missing

# HTML 커버리지 리포트
pytest tests/ --cov=. --cov-report=html
# 브라우저에서 htmlcov/index.html 열기

# 특정 서비스 커버리지
pytest tests/unit/monitoring/ --cov=monitoring_svc --cov-report=term-missing
```

### 4.4 필터링

```bash
# 키워드로 테스트 실행
pytest tests/ -k "health"              # 모든 health 테스트
pytest tests/ -k "mlflow and client"   # MLflow 클라이언트 테스트만
pytest tests/ -k "not k8s"             # K8s 테스트 제외

# 마지막 실행에서 실패한 테스트만 재실행
pytest tests/ --lf

# 첫 실패 시 중지
pytest tests/ -x
```

### 4.5 디버그 모드

```bash
# print() 출력 표시
pytest tests/ -s

# 상세 출력 + 전체 트레이스백
pytest tests/ -vv --tb=long

# 실패 시 디버거 진입
pytest tests/ --pdb
```

---

## 5. 테스트 구조 및 컨벤션

### 5.1 파일 명명 규칙

```
tests/unit/{서비스}/test_{모듈}.py
```

| 패턴 | 예시 |
|------|------|
| 클라이언트 테스트 | `test_mlflow_client.py` |
| 라우터 테스트 | `test_mlflow_router.py` |
| 헬스체크 테스트 | `test_health.py` |

### 5.2 테스트 함수 명명 규칙

```python
# 패턴: test_{대상}_{기대_동작}
async def test_list_experiments():                    # 정상 경로
async def test_compare_runs_empty_ids():              # 엣지 케이스
async def test_proxy_upstream_error_returns_502():    # 에러 케이스
async def test_query_range_uses_cache():              # 캐싱 동작
```

### 5.3 표준 테스트 레이아웃 (AAA 패턴)

```python
@pytest.mark.asyncio
async def test_list_services(serving_client, mock_redis):
    # Arrange (준비): 모킹 설정
    with patch("serving_svc.routers.inference._kserve") as mock_factory:
        mock_client = MagicMock()
        mock_client.list.return_value = [MOCK_ISVC_RAW]
        mock_factory.return_value = mock_client

        # Act (실행): 엔드포인트 호출
        resp = await serving_client.get("/inference-services/")

        # Assert (검증): 응답 확인
        assert resp.status_code == 200
        body = resp.json()
        assert len(body) == 1
        assert body[0]["name"] == "test-model"
```

---

## 6. 테스트 작성 단계별 가이드

### 6.1 클라이언트 테스트 (respx로 HTTP 모킹)

클라이언트는 업스트림 서비스에 실제 HTTP 호출을 합니다. `respx`로 이를 가로챕니다.

```python
# tests/unit/mlops/test_mlflow_client.py
import pytest
import respx
import httpx

from mlops_svc.clients.mlflow_client import MLflowClient

MLFLOW_URL = "http://mlflow-test:5000"


@pytest.fixture
def mlflow_client():
    return MLflowClient(MLFLOW_URL)


@pytest.mark.asyncio
async def test_list_experiments(mlflow_client):
    with respx.mock:
        # 1. 업스트림 HTTP 호출 모킹
        respx.get(f"{MLFLOW_URL}/api/2.0/mlflow/experiments/list").mock(
            return_value=httpx.Response(
                200,
                json={
                    "experiments": [
                        {
                            "experiment_id": "1",
                            "name": "test-exp",
                            "artifact_location": "s3://bucket/1",
                            "lifecycle_stage": "active",
                        }
                    ]
                },
            )
        )

        # 2. 클라이언트 메서드 호출
        experiments = await mlflow_client.list_experiments()

        # 3. 검증
        assert len(experiments) == 1
        assert experiments[0].experiment_id == "1"
        assert experiments[0].name == "test-exp"
```

### 6.2 라우터 테스트 (엔드포인트 모킹)

라우터는 클라이언트 팩토리 함수를 사용합니다. 팩토리를 패치하여 모킹 클라이언트를 주입합니다.

```python
# tests/unit/pipeline/test_connections_router.py
from unittest.mock import AsyncMock, patch
import pytest

CONNECTIONS = [
    {"connectionId": "conn-1", "name": "pg-to-snowflake", "status": "active"}
]


@pytest.mark.asyncio
async def test_list_connections_endpoint(pipeline_client, mock_redis):
    with patch("pipeline_svc.routers.airbyte._airbyte") as mock_factory:
        # 1. 모킹 클라이언트 생성
        mock_client = AsyncMock()
        mock_client.list_connections = AsyncMock(return_value=CONNECTIONS)
        mock_client.close = AsyncMock()
        mock_factory.return_value = mock_client

        # 2. 테스트 클라이언트로 엔드포인트 호출
        resp = await pipeline_client.get("/connections/")

        # 3. 응답 검증
        assert resp.status_code == 200
        body = resp.json()
        assert len(body) == 1
        assert body[0]["name"] == "pg-to-snowflake"
```

### 6.3 게이트웨이 프록시 테스트

게이트웨이는 다운스트림 서비스에 요청을 프록시합니다. `respx`로 업스트림을 모킹합니다.

```python
# tests/unit/gateway/test_proxy.py
import pytest
import respx
import httpx


@pytest.mark.asyncio
@respx.mock
async def test_proxy_monitoring_forwards_request(gateway_client, mock_redis):
    # 1. 업스트림 서비스 모킹
    respx.get("http://monitoring-svc:8001/health").mock(
        return_value=httpx.Response(200, json={"status": "ok", "service": "monitoring-svc"})
    )

    # 2. 게이트웨이를 통해 요청 전송
    resp = await gateway_client.get(
        "/api/v1/monitoring/health",
        headers={"Authorization": "Bearer tok"},
    )

    # 3. 프록시 정상 동작 검증
    assert resp.status_code == 200
    data = resp.json()
    assert data["service"] == "monitoring-svc"
```

### 6.4 인증 테스트 (Keycloak 모킹)

```python
# tests/unit/gateway/test_auth_router.py
import pytest
import respx
import httpx

KEYCLOAK_TOKEN_URL = (
    "https://keycloak.company.com/realms/mlops-platform"
    "/protocol/openid-connect/token"
)


@pytest.mark.asyncio
@respx.mock
async def test_login_success(gateway_client, mock_redis):
    respx.post(KEYCLOAK_TOKEN_URL).mock(
        return_value=httpx.Response(200, json={
            "access_token": "fake-access",
            "refresh_token": "fake-refresh",
            "expires_in": 900,
        })
    )

    resp = await gateway_client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "secret"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["access_token"] == "fake-access"
    assert data["token_type"] == "bearer"
```

### 6.5 Redis 캐시 테스트

```python
# tests/unit/monitoring/test_metrics_router.py
from unittest.mock import AsyncMock, patch
import json
import pytest

QUERY_RANGE_RESULT = {
    "resultType": "matrix",
    "result": [{"metric": {"__name__": "cpu_usage"}, "values": [[1000, "0.5"]]}],
}


@pytest.mark.asyncio
async def test_query_range_uses_cache(client, mock_redis):
    """캐시에 데이터가 있으면 Prometheus를 호출하지 않아야 함"""
    # 1. 캐시 사전 설정
    mock_redis.get = AsyncMock(return_value=json.dumps(QUERY_RANGE_RESULT))

    with patch("monitoring_svc.routers.metrics._prom") as mock_prom_factory:
        mock_prom = AsyncMock()
        mock_prom_factory.return_value = mock_prom

        # 2. 엔드포인트 호출
        resp = await client.get(
            "/metrics/query_range",
            params={"query": "cpu_usage", "start": "1000", "end": "2000"},
        )

        # 3. 캐시 히트: Prometheus 호출되지 않음
        assert resp.status_code == 200
        mock_prom.query_range.assert_not_called()
```

---

## 7. Fixture 레퍼런스

모든 Fixture는 `tests/conftest.py`에 정의되어 있습니다.

### 7.1 앱 & 클라이언트 Fixture

| Fixture | 서비스 | 기본 URL |
|---------|-------|----------|
| `app` / `client` | 모니터링 (:8001) | `http://test` |
| `pipeline_app` / `pipeline_client` | 파이프라인 (:8002) | `http://test` |
| `serving_app` / `serving_client` | 서빙 (:8003) | `http://test` |
| `mlops_app` / `mlops_client` | MLOps (:8004) | `http://test` |
| `gateway_app` / `gateway_client` | API Gateway (:8000) | `http://test` |

사용 예:

```python
async def test_health(client):               # 모니터링 앱 사용
async def test_flows(pipeline_client):        # 파이프라인 앱 사용
async def test_isvc(serving_client):          # 서빙 앱 사용
async def test_experiments(mlops_client):     # MLOps 앱 사용
async def test_proxy(gateway_client):         # 게이트웨이 앱 사용
```

### 7.2 모킹 Fixture

| Fixture | 모킹 대상 | 주요 메서드 |
|---------|----------|------------|
| `mock_redis` | `shared.cache._redis` | `.get()`, `.set()`, `.incr()`, `.expire()`, `.pipeline()` |
| `mock_prometheus_response` | 팩토리 함수 | `_build(result_type, results)` |

### 7.3 Fixture 조합 방식

```python
@pytest.mark.asyncio
async def test_example(gateway_client, mock_redis):
    #                    ^^^^^^^^^^^^^^^  ^^^^^^^^^^
    #                    1. ASGI 테스트    2. Redis를 패치하여
    #                       클라이언트로      실제 연결 없이
    #                       FastAPI 앱       테스트 가능
    #                       생성
    pass
```

---

## 8. 모킹 패턴

### 8.1 HTTP 호출 모킹 (respx)

```python
import respx, httpx

# 방법 1: 컨텍스트 매니저
with respx.mock:
    respx.get("http://service/api").mock(
        return_value=httpx.Response(200, json={"key": "value"})
    )
    # ... 테스트 코드 ...

# 방법 2: 데코레이터
@respx.mock
async def test_something():
    respx.post("http://service/api").mock(
        return_value=httpx.Response(201, json={"created": True})
    )

# 방법 3: 에러 모킹
respx.get("http://service/api").mock(side_effect=httpx.ConnectError("refused"))
```

### 8.2 클라이언트 팩토리 모킹 (patch)

```python
from unittest.mock import AsyncMock, MagicMock, patch

# 비동기 클라이언트 (Airbyte, Prefect, Prometheus, Loki, Tempo)
with patch("module.router._factory") as factory:
    mock = AsyncMock()
    mock.method = AsyncMock(return_value=data)
    mock.close = AsyncMock()
    factory.return_value = mock

# 동기 클라이언트 (KServe, K8s)
with patch("module.router._factory") as factory:
    mock = MagicMock()
    mock.method.return_value = data
    factory.return_value = mock
```

### 8.3 Redis 모킹

`mock_redis` Fixture는 자동으로 사용 가능합니다. 특정 메서드를 오버라이드할 수 있습니다:

```python
async def test_cache_hit(client, mock_redis):
    mock_redis.get = AsyncMock(return_value='{"cached": true}')
    # ... 엔드포인트가 캐시 히트를 찾음 ...

async def test_cache_miss(client, mock_redis):
    mock_redis.get = AsyncMock(return_value=None)  # 기본값
    # ... 엔드포인트가 업스트림을 호출함 ...
```

---

## 9. 커버리지

### 9.1 목표

| 계층 | 목표 |
|------|------|
| 서비스 클라이언트 | 90% 이상 |
| API 라우터 | 85% 이상 |
| 공유 모듈 | 90% 이상 |
| 전체 | 80% 이상 |

### 9.2 명령어

```bash
# 전체 커버리지 리포트
pytest tests/ --cov=. --cov-report=term-missing --cov-report=html

# 특정 서비스 커버리지
pytest tests/unit/monitoring/ --cov=monitoring_svc --cov-report=term-missing

# 커버리지 임계값 확인
pytest tests/ --cov=. --cov-fail-under=80
```

### 9.3 파일 제외

필요 시 `pyproject.toml`에 추가:

```toml
[tool.coverage.run]
omit = ["tests/*", ".venv/*", "*/config.py"]
```

---

## 10. 문제 해결

### "Redis not initialised" 에러

게이트웨이/서비스 엔드포인트를 사용하는 테스트는 `mock_redis` Fixture가 필요합니다:

```python
# 잘못된 예
async def test_health(gateway_client):  # 실패함

# 올바른 예
async def test_health(gateway_client, mock_redis):  # mock_redis가 Redis를 패치
```

### "AUTH_VERIFY_TOKEN" 미설정

`conftest.py`에서 자동으로 설정합니다. pytest 외부에서 단일 파일을 실행하는 경우:

```bash
AUTH_VERIFY_TOKEN=false pytest tests/unit/gateway/test_health.py
```

### respx가 요청을 가로채지 못하는 경우

모킹 URL이 정확히 일치하는지 확인하세요 (프로토콜, 호스트, 포트 포함):

```python
# 잘못된 예: 포트 누락
respx.get("http://monitoring-svc/health")

# 올바른 예: 설정 기본값과 일치
respx.get("http://monitoring-svc:8001/health")
```

서비스 URL은 config 파일에서 확인하세요:
- `api_gateway/config.py` -> `monitoring_svc_url = "http://monitoring-svc:8001"`
- `mlops_svc/config.py` -> `mlflow_url = "http://mlflow:5000"`
- `pipeline_svc/config.py` -> `airbyte_url = "http://airbyte-server:8001"`
- `serving_svc/config.py` -> `kserve_namespace = "model-serving"`

### async 테스트가 실행되지 않는 경우

`pyproject.toml`에 `asyncio_mode = "auto"`가 있는지 확인하세요. 또는 데코레이터를 사용합니다:

```python
@pytest.mark.asyncio
async def test_something():
    ...
```

### Import 에러

항상 `packages/backend/` 디렉터리에서 pytest를 실행하여 모든 모듈을 찾을 수 있게 합니다:

```bash
cd packages/backend
source .venv/bin/activate
pytest tests/ -v
```
