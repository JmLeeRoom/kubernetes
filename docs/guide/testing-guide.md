# 테스트 가이드

> MLOps Platform 전체 테스트 전략 및 실행 방법

---

## 목차

1. [테스트 철학](#1-테스트-철학)
2. [프론트엔드 테스트](#2-프론트엔드-테스트)
3. [백엔드 테스트](#3-백엔드-테스트)
4. [E2E 테스트](#4-e2e-테스트)
5. [CI 통합](#5-ci-통합)
6. [커버리지 목표](#6-커버리지-목표)
7. [문제 해결](#7-문제-해결)

---

## 1. 테스트 철학

본 프로젝트는 **TDD (Test-Driven Development)** 워크플로우를 따릅니다.

```
Red → Green → Refactor
```

1. **Red**: 기대 동작을 정의하는 실패하는 테스트를 작성합니다.
2. **Green**: 테스트를 통과시키는 최소한의 코드를 구현합니다.
3. **Refactor**: 테스트를 유지하면서 코드를 정리합니다.

### 테스트 피라미드

```
        ╱ E2E ╲           ← Playwright (핵심 시나리오)
       ╱────────╲
      ╱ 통합 테스트 ╲       ← API 라우터 + MSW 핸들러
     ╱──────────────╲
    ╱   단위 테스트    ╲     ← 컴포넌트, 훅, 유틸, 클라이언트
   ╱────────────────────╲
```

---

## 2. 프론트엔드 테스트

### 2.1 기술 스택

| 도구 | 용도 |
|------|------|
| **Vitest** | 테스트 러너 (Vite 네이티브 호환) |
| **@testing-library/react** | 컴포넌트 렌더링 및 DOM 쿼리 |
| **MSW (Mock Service Worker)** | 네트워크 레벨 API 모킹 |
| **@faker-js/faker** | 현실적인 목 데이터 생성 |

### 2.2 실행 방법

```bash
cd packages/frontend

# 전체 테스트 실행
pnpm test

# Watch 모드 (파일 변경 시 자동 재실행)
pnpm test:watch

# 커버리지 포함 실행
pnpm test:coverage

# 특정 파일만 실행
npx vitest run src/lib/__tests__/auth.test.ts

# 특정 패턴 매칭
npx vitest run --grep "renders heading"
```

### 2.3 테스트 설정

**글로벌 설정** (`src/test/setup.ts`):

```typescript
import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '../mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- `beforeAll`: MSW 서버 시작
- `afterEach`: 핸들러 초기화 (테스트 간 격리)
- `afterAll`: MSW 서버 종료

**렌더 헬퍼** (`src/test/utils.tsx`):

```typescript
import { renderWithProviders } from '@/test/utils';

// 자동으로 QueryClientProvider + MemoryRouter를 감싸줍니다
renderWithProviders(<MyComponent />);

// 특정 라우트로 시작
renderWithProviders(<MyComponent />, { route: '/dashboard' });
```

항상 `renderWithProviders()`를 사용하세요. `render()`를 직접 사용하지 마세요.

### 2.4 컴포넌트 테스트 작성 패턴

```typescript
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

describe('MyComponent', () => {
  // 1. 정상 렌더링
  it('renders data from API', async () => {
    renderWithProviders(<MyComponent />);
    await waitFor(() => {
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  // 2. 에러 상태
  it('shows error state on API failure', async () => {
    server.use(
      http.get('/api/v1/endpoint', () =>
        HttpResponse.json({}, { status: 503 })
      )
    );
    renderWithProviders(<MyComponent />);
    await waitFor(() => {
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    });
  });

  // 3. 로딩 상태
  it('shows skeleton while loading', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });
});
```

### 2.5 훅 테스트 작성 패턴

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

describe('useSSE', () => {
  it('connects to EventSource', () => {
    const mockEventSource = vi.fn();
    vi.stubGlobal('EventSource', mockEventSource);

    renderHook(() => useSSE('/api/v1/metrics/stream'));
    expect(mockEventSource).toHaveBeenCalledWith('/api/v1/metrics/stream');
  });
});
```

### 2.6 MSW 핸들러

MSW 핸들러는 `src/mocks/handlers/` 아래에 도메인별로 관리합니다:

```
src/mocks/handlers/
├── auth.ts        # 인증 API 모킹
├── monitoring.ts  # 모니터링 API 모킹
├── pipeline.ts    # 파이프라인 API 모킹
├── serving.ts     # 서빙 API 모킹
└── mlops.ts       # MLOps API 모킹
```

**규칙:**
- 새 API 엔드포인트를 추가할 때는 **반드시** MSW 핸들러도 추가하세요.
- 구현체가 아닌 **네트워크 레벨**에서 모킹하세요 (`vi.mock` 사용 금지).
- `faker`를 사용해 현실적인 데이터를 생성하세요.

### 2.7 파일 구조

```
src/
├── features/monitoring/__tests__/
│   ├── MetricsExplorerPage.test.tsx
│   ├── LogViewerPage.test.tsx
│   └── TraceExplorerPage.test.tsx
├── stores/__tests__/
│   ├── authStore.test.ts
│   └── uiStore.test.ts
├── hooks/__tests__/
│   ├── useSSE.test.ts
│   └── useWebSocket.test.ts
└── lib/__tests__/
    ├── auth.test.ts
    └── formatters.test.ts
```

---

## 3. 백엔드 테스트

### 3.1 기술 스택

| 도구 | 용도 |
|------|------|
| **pytest** | 테스트 러너 |
| **pytest-asyncio** | 비동기 테스트 지원 |
| **respx** | httpx 요청 모킹 |
| **httpx + ASGITransport** | FastAPI 앱 직접 테스트 |
| **unittest.mock** | K8s 클라이언트 등 모킹 |

### 3.2 실행 방법

```bash
cd packages/backend

# 가상환경 활성화
source .venv/bin/activate

# 전체 테스트 실행
pytest tests/unit/ -v

# 특정 서비스 테스트
pytest tests/unit/monitoring/ -v
pytest tests/unit/serving/ -v
pytest tests/unit/gateway/ -v

# 특정 테스트 파일
pytest tests/unit/monitoring/test_alerts_router.py -v

# 커버리지 포함
pytest tests/unit/ --cov --cov-report=html

# 키워드 필터
pytest -k "test_list_services" -v
```

### 3.3 설정

**pyproject.toml:**

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
addopts = "-v --tb=short"
```

`asyncio_mode = "auto"` 설정으로 `@pytest.mark.asyncio`를 매번 붙일 필요가 없습니다.

### 3.4 Fixture 구조 (`tests/conftest.py`)

```python
# 서비스별 앱 인스턴스
@pytest.fixture
def app():  # monitoring
@pytest.fixture
def pipeline_app():
@pytest.fixture
def serving_app():
@pytest.fixture
def mlops_app():
@pytest.fixture
def gateway_app():

# 서비스별 비동기 테스트 클라이언트
@pytest.fixture
async def client(app):  # monitoring
@pytest.fixture
async def pipeline_client(pipeline_app):
@pytest.fixture
async def serving_client(serving_app):
@pytest.fixture
async def mlops_client(mlops_app):
@pytest.fixture
async def gateway_client(gateway_app):

# Redis 모킹 (실제 연결 불필요)
@pytest.fixture
def mock_redis():

# Prometheus 응답 팩토리
@pytest.fixture
def mock_prometheus_response():
```

### 3.5 라우터 테스트 작성 패턴

```python
import respx
from httpx import Response

async def test_list_alerts(client, mock_redis):
    """Prometheus API 응답을 모킹하여 알림 목록을 테스트합니다."""
    with respx.mock:
        respx.get("http://prometheus:9090/api/v1/alerts").mock(
            return_value=Response(200, json={
                "status": "success",
                "data": {"alerts": [{"labels": {"alertname": "HighCPU"}}]}
            })
        )
        resp = await client.get("/alerts/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
```

### 3.6 클라이언트 테스트 작성 패턴

```python
import respx
from httpx import Response
from monitoring_svc.clients.loki import LokiClient

async def test_query_logs():
    """Loki 클라이언트의 query 메서드를 테스트합니다."""
    with respx.mock:
        respx.get("http://loki:3100/loki/api/v1/query_range").mock(
            return_value=Response(200, json={
                "status": "success",
                "data": {"result": []}
            })
        )
        loki = LokiClient("http://loki:3100")
        result = await loki.query('{app="test"}')
        assert result is not None
```

### 3.7 K8s 모킹 패턴

```python
from unittest.mock import patch, MagicMock

async def test_list_nodes(client, mock_redis):
    mock_v1 = MagicMock()
    mock_v1.list_node.return_value.items = [
        MagicMock(metadata=MagicMock(name="node-1"))
    ]
    with patch("monitoring_svc.clients.k8s_client.client.CoreV1Api", return_value=mock_v1):
        resp = await client.get("/k8s/nodes")
        assert resp.status_code == 200
```

### 3.8 파일 구조

```
tests/
├── conftest.py
└── unit/
    ├── gateway/
    │   ├── test_health.py
    │   ├── test_auth_router.py
    │   └── test_proxy.py
    ├── monitoring/
    │   ├── test_alerts_router.py
    │   ├── test_k8s_router.py
    │   ├── test_logs_router.py
    │   ├── test_traces_router.py
    │   ├── test_loki_client.py
    │   └── test_tempo_client.py
    ├── pipeline/
    │   ├── test_airbyte.py
    │   ├── test_connections_router.py
    │   ├── test_health.py
    │   └── test_prefect.py
    ├── serving/
    │   ├── test_health.py
    │   ├── test_inference_router.py
    │   └── test_kserve.py
    ├── mlops/
    │   └── ...
    └── shared/
        ├── test_auth.py
        └── test_cache.py
```

---

## 4. E2E 테스트

### 4.1 기술 스택

| 도구 | 용도 |
|------|------|
| **Playwright** | 브라우저 기반 E2E 테스트 |
| **Chromium + Firefox** | 크로스 브라우저 테스트 |

### 4.2 실행 방법

```bash
cd e2e

# 의존성 설치
pnpm install
npx playwright install

# 테스트 실행 (앱이 실행 중이어야 합니다)
pnpm test

# 특정 테스트 파일
npx playwright test tests/monitoring.spec.ts

# UI 모드 (디버깅)
npx playwright test --ui

# 특정 브라우저
npx playwright test --project=chromium
```

### 4.3 사전 요구사항

E2E 테스트 실행 전 앱이 실행 중이어야 합니다:

```bash
# 방법 1: MSW 모드로 프론트엔드만 실행
cd packages/frontend
VITE_MSW_ENABLED=true pnpm dev

# 방법 2: docker-compose로 전체 스택 실행
docker compose up -d
```

기본 URL: `http://localhost:5173` (환경변수 `E2E_BASE_URL`로 변경 가능)

### 4.4 인증 Fixture

`fixtures/auth.ts`에서 `loginAsUser` fixture를 제공합니다:

```typescript
import { test, expect } from '../fixtures/auth';

test('should display page', async ({ loggedInPage: page }) => {
  await page.goto('/monitoring/cluster');
  await expect(page.getByText('Cluster Overview')).toBeVisible();
});
```

지원 역할: `admin`, `ml-engineer`, `data-engineer`, `viewer`

### 4.5 설정

**playwright.config.ts 주요 설정:**

| 설정 | 값 | 설명 |
|------|-----|------|
| `retries` | CI에서 2회 | 불안정한 테스트 대응 |
| `trace` | 첫 재시도 시 | 디버깅용 트레이스 파일 생성 |
| `screenshot` | 실패 시 | 실패한 테스트 스크린샷 자동 저장 |

### 4.6 테스트 시나리오

| 파일 | 시나리오 |
|------|---------|
| `monitoring.spec.ts` | 클러스터 개요, 메트릭, 로그, 트레이스, 알림 페이지 |
| `pipeline.spec.ts` | 연결, 플로우, Spark 작업 페이지 |
| `serving.spec.ts` | 모델 목록, 배포 폼, 트래픽 분할 |
| `mlops.spec.ts` | 실험, DAG 목록, 모델 레지스트리 |

---

## 5. CI 통합

### 5.1 GitHub Actions (`.github/workflows/ci.yml`)

CI 파이프라인은 두 개의 병렬 작업으로 구성됩니다:

```
Push/PR → main, develop
    ├─ Frontend Job
    │   ├─ pnpm install --frozen-lockfile
    │   ├─ pnpm lint
    │   ├─ pnpm test:coverage
    │   └─ Codecov 업로드
    │
    └─ Backend Job
        ├─ pip install -r requirements.dev.txt
        ├─ ruff check
        ├─ pytest --cov --cov-report=xml
        └─ Codecov 업로드
```

### 5.2 로컬에서 CI 시뮬레이션

```bash
# 프론트엔드 (CI와 동일)
cd packages/frontend
pnpm lint && pnpm test:coverage

# 백엔드 (CI와 동일)
cd packages/backend
source .venv/bin/activate
ruff check .
pytest tests/unit/ --cov --cov-report=html
```

---

## 6. 커버리지 목표

| 레이어 | 목표 | 비고 |
|--------|------|------|
| 프론트엔드 컴포넌트 | 80% | 핵심 컴포넌트는 100% 목표 |
| 프론트엔드 커스텀 훅 | 90% | 비즈니스 로직 집중 |
| 백엔드 API 라우터 | 85% | 각 엔드포인트 단위 테스트 |
| 백엔드 서비스 클라이언트 | 90% | 업스트림 API 모킹 |
| 통합 테스트 (Critical Path) | 100% | |

---

## 7. 문제 해결

### 자주 발생하는 문제

**Q: 프론트엔드 테스트에서 `act()` 경고가 발생합니다**

`waitFor`를 사용하여 상태 업데이트를 기다리세요:

```typescript
await waitFor(() => {
  expect(screen.getByText('...')).toBeInTheDocument();
});
```

**Q: React Router Future Flag 경고가 나옵니다**

테스트 결과에는 영향을 주지 않습니다. React Router v7로 마이그레이션할 때 해결됩니다.

**Q: 백엔드 테스트에서 `AUTH_VERIFY_TOKEN` 관련 에러가 발생합니다**

`conftest.py`에서 `os.environ.setdefault("AUTH_VERIFY_TOKEN", "false")`로 설정되어 있습니다. 환경변수가 다른 곳에서 `true`로 설정되어 있지 않은지 확인하세요.

**Q: MSW에서 `unhandled request` 경고가 나옵니다**

새로운 API 호출에 대한 MSW 핸들러가 없다는 의미입니다. `src/mocks/handlers/` 아래에 해당 엔드포인트의 핸들러를 추가하세요.

**Q: E2E 테스트가 타임아웃됩니다**

1. 앱이 `http://localhost:5173`에서 실행 중인지 확인합니다.
2. `E2E_BASE_URL` 환경변수가 올바른지 확인합니다.
3. `npx playwright test --ui`로 디버깅합니다.

**Q: `pytest`에서 모듈 import 에러가 발생합니다**

`packages/backend/` 디렉토리에서 실행하고 있는지 확인하세요:

```bash
cd packages/backend
source .venv/bin/activate
pytest tests/unit/ -v
```
