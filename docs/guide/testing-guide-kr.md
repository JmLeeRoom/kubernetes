# MLOps Platform 테스트 가이드

> 프론트엔드와 백엔드를 각각 독립적으로 테스트하는 방법을 정리한 문서입니다.

---

## 목차

1. [사전 준비](#1-사전-준비)
2. [프론트엔드 테스트](#2-프론트엔드-테스트)
3. [백엔드 테스트](#3-백엔드-테스트)
4. [E2E 테스트](#4-e2e-테스트)
5. [CI/CD에서의 테스트](#5-cicd에서의-테스트)

---

## 1. 사전 준비

### 시스템 요구사항

| 구분 | 요구사항 |
|------|----------|
| Node.js | >= 20.0.0 |
| pnpm | >= 8.0.0 |
| Python | >= 3.11 |
| pip | 최신 버전 |

### 프로젝트 초기 설정

```bash
# 저장소 클론
git clone <repository-url>
cd mlops-platform

# 프론트엔드 의존성 설치
pnpm install

# 백엔드 의존성 설치
pip install -r packages/backend/requirements.txt
pip install -r packages/backend/requirements.dev.txt
```

---

## 2. 프론트엔드 테스트

### 2.1 기술 스택

| 도구 | 버전 | 용도 |
|------|------|------|
| Vitest | ^1.4.0 | 테스트 프레임워크 (Jest 호환) |
| @testing-library/react | ^14.2.2 | 컴포넌트 렌더링 및 DOM 조작 |
| @testing-library/jest-dom | ^6.4.2 | DOM 매처 확장 (toBeVisible 등) |
| @testing-library/user-event | ^14.5.2 | 사용자 인터랙션 시뮬레이션 |
| MSW | ^2.2.13 | API 모킹 (네트워크 레벨) |
| jsdom | ^24.0.0 | 브라우저 DOM 환경 |
| @faker-js/faker | ^8.4.1 | 테스트 데이터 생성 |
| @vitest/coverage-v8 | ^1.4.0 | 코드 커버리지 |

### 2.2 테스트 실행 명령어

```bash
# 단일 실행 (CI용)
pnpm --filter frontend test

# 워치 모드 (개발 중 실시간 실행)
pnpm --filter frontend test:watch

# 커버리지 포함 실행
pnpm --filter frontend test:coverage
```

### 2.3 설정 파일 구조

```
packages/frontend/
├── vite.config.ts          # Vitest 설정 포함
├── src/
│   ├── test/
│   │   ├── setup.ts        # 전역 테스트 셋업 (MSW 서버 시작/종료)
│   │   ├── utils.tsx        # renderWithProviders 헬퍼
│   │   └── smoke.test.tsx   # 공통 컴포넌트 스모크 테스트
│   └── mocks/
│       ├── server.ts        # MSW 서버 (테스트용 Node 환경)
│       ├── browser.ts       # MSW 워커 (개발용 브라우저 환경)
│       └── handlers/        # API 핸들러 (도메인별 분리)
│           ├── auth.ts
│           ├── monitoring.ts
│           ├── pipeline.ts
│           ├── serving.ts
│           └── mlops.ts
```

**Vitest 설정 (`vite.config.ts`):**

```typescript
test: {
  globals: true,              // describe, it, expect를 import 없이 사용
  environment: 'jsdom',       // 브라우저 DOM 시뮬레이션
  setupFiles: './src/test/setup.ts',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov'],
    exclude: ['src/mocks/**', 'src/components/ui/**'],
    thresholds: {
      lines: 80,              // 최소 80% 라인 커버리지
      functions: 80,          // 최소 80% 함수 커버리지
      branches: 75,           // 최소 75% 분기 커버리지
    },
  },
}
```

### 2.4 테스트 셋업 동작 원리

**`src/test/setup.ts`** — 모든 테스트 전에 자동 실행됩니다:

```typescript
import '@testing-library/jest-dom';
import { server } from '../mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- `beforeAll`: MSW 서버를 시작하여 모든 HTTP 요청을 인터셉트
- `afterEach`: 테스트별 핸들러 오버라이드를 초기화
- `afterAll`: MSW 서버 종료
- 처리되지 않은 요청은 경고 로그 출력

### 2.5 테스트 작성 패턴

#### 컴포넌트 테스트

`renderWithProviders` 헬퍼를 사용하면 QueryClient와 Router가 자동으로 래핑됩니다:

```typescript
// src/features/auth/__tests__/LoginPage.test.tsx
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { LoginPage } from '../LoginPage';

describe('LoginPage', () => {
  it('이메일과 비밀번호 입력 필드를 렌더링한다', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('로그인 버튼이 존재한다', () => {
    renderWithProviders(<LoginPage />, { route: '/login' });

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
```

#### Zustand 스토어 테스트

스토어는 `setState`/`getState`를 직접 호출하여 테스트합니다:

```typescript
// src/stores/__tests__/authStore.test.ts
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
    });
  });

  it('setTokens가 토큰을 올바르게 저장한다', () => {
    useAuthStore.getState().setTokens('access-123', 'refresh-456');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access-123');
    expect(state.refreshToken).toBe('refresh-456');
  });

  it('logout이 모든 상태를 초기화한다', () => {
    useAuthStore.setState({ accessToken: 'token', user: { name: 'test' } });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
```

#### 유틸리티 함수 테스트

```typescript
// src/lib/__tests__/formatters.test.ts
import { formatBytes, formatDuration } from '../formatters';

describe('formatBytes', () => {
  it('바이트를 사람이 읽기 쉬운 형태로 변환한다', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });
});
```

#### MSW 핸들러 오버라이드 (특정 테스트에서 에러 시뮬레이션)

```typescript
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

it('API 에러 시 에러 메시지를 표시한다', async () => {
  // 이 테스트에서만 500 에러를 반환하도록 오버라이드
  server.use(
    http.get('/api/v1/monitoring/nodes', () => {
      return new HttpResponse(null, { status: 500 });
    }),
  );

  renderWithProviders(<ClusterOverviewPage />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### 2.6 MSW 핸들러 작성 예시

```typescript
// src/mocks/handlers/monitoring.ts
import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';

function generateNode() {
  return {
    name: faker.string.alphanumeric(8),
    status: faker.helpers.arrayElement(['Ready', 'NotReady']),
    cpu: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
    memory: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
  };
}

export const monitoringHandlers = [
  http.get('/api/v1/monitoring/k8s/nodes', () => {
    const nodes = Array.from({ length: 3 }, generateNode);
    return HttpResponse.json(nodes);
  }),

  http.get('/api/v1/monitoring/k8s/pods', ({ request }) => {
    const url = new URL(request.url);
    const namespace = url.searchParams.get('namespace');
    // namespace 파라미터에 따라 다른 데이터 반환
    return HttpResponse.json({ pods: [], namespace });
  }),
];
```

### 2.7 커버리지 기준

CI에서 아래 기준을 충족하지 못하면 빌드가 실패합니다:

| 항목 | 최소 기준 |
|------|----------|
| Lines | 80% |
| Functions | 80% |
| Branches | 75% |

커버리지에서 제외되는 디렉토리:
- `src/mocks/**` — MSW 핸들러 (테스트 인프라)
- `src/components/ui/**` — shadcn/ui 컴포넌트 (서드파티)

---

## 3. 백엔드 테스트

### 3.1 기술 스택

| 도구 | 버전 | 용도 |
|------|------|------|
| pytest | 8.2.0 | 테스트 프레임워크 |
| pytest-asyncio | 0.23.6 | async/await 테스트 지원 |
| pytest-cov | 5.0.0 | 코드 커버리지 |
| respx | 0.21.1 | httpx 요청 모킹 |
| ruff | 0.4.4 | 린팅 (빠른 Python linter) |
| black | 24.4.2 | 코드 포매팅 |
| mypy | 1.10.0 | 정적 타입 검사 |
| faker | 25.0.0 | 테스트 데이터 생성 |

### 3.2 테스트 실행 명령어

```bash
# 단위 테스트 실행
pytest packages/backend/tests/unit/ -v

# 커버리지 포함 실행
pytest packages/backend/tests/unit/ -v --cov --cov-report=term-missing

# XML 커버리지 리포트 (CI용)
pytest packages/backend/tests/unit/ -v --cov --cov-report=xml

# 특정 서비스만 테스트
pytest packages/backend/tests/unit/monitoring/ -v
pytest packages/backend/tests/unit/serving/ -v
pytest packages/backend/tests/unit/pipeline/ -v
pytest packages/backend/tests/unit/mlops/ -v
pytest packages/backend/tests/unit/gateway/ -v
pytest packages/backend/tests/unit/shared/ -v

# 특정 테스트 함수만 실행
pytest packages/backend/tests/unit/monitoring/test_metrics_router.py::test_query_range -v

# 린팅
ruff check packages/backend/

# 포매팅 확인
black --check packages/backend/

# 타입 검사
mypy packages/backend/
```

### 3.3 설정 파일

**`packages/backend/pyproject.toml`:**

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"       # async 테스트를 자동으로 감지하여 실행
testpaths = ["tests"]       # 테스트 디렉토리
addopts = "-v --tb=short"   # 기본 옵션: 상세 출력, 짧은 트레이스백

[tool.ruff]
line-length = 100
target-version = "py311"
select = ["E", "F", "I", "UP", "B", "SIM"]  # 린트 규칙

[tool.black]
line-length = 100
target-version = ["py311"]

[tool.mypy]
python_version = "3.11"
strict = true
```

### 3.4 테스트 디렉토리 구조

```
packages/backend/tests/
├── conftest.py                    # 전역 픽스처 정의
└── unit/
    ├── gateway/
    │   ├── test_auth_router.py    # 인증 라우터 테스트
    │   └── test_proxy.py          # 프록시 라우터 테스트
    ├── monitoring/
    │   ├── test_metrics_router.py # 메트릭 조회 테스트
    │   ├── test_logs_router.py    # 로그 조회 테스트
    │   ├── test_traces_router.py  # 트레이스 테스트
    │   ├── test_k8s_router.py     # K8s API 테스트
    │   └── test_alerts_router.py  # 알림 테스트
    ├── pipeline/
    │   ├── test_airbyte.py        # Airbyte 클라이언트 테스트
    │   ├── test_prefect.py        # Prefect 클라이언트 테스트
    │   └── test_spark.py          # Spark 클라이언트 테스트
    ├── serving/
    │   ├── test_inference.py      # KServe 추론 서비스 테스트
    │   └── test_health.py         # 헬스체크 테스트
    ├── mlops/
    │   ├── test_experiments.py    # MLflow 실험 테스트
    │   ├── test_dags.py           # Airflow DAG 테스트
    │   └── test_lineage.py        # 리니지 테스트
    └── shared/
        ├── test_auth.py           # 공통 인증 모듈 테스트
        └── test_cache.py          # 캐시 모듈 테스트
```

### 3.5 conftest.py 픽스처 상세

```python
# tests/conftest.py

import os
os.environ.setdefault("AUTH_VERIFY_TOKEN", "false")  # 테스트에서 JWT 검증 비활성화

import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch

# ── 서비스별 앱 픽스처 ──

@pytest.fixture
def app():
    """모니터링 서비스 앱 인스턴스"""
    from monitoring_svc.main import app
    return app

@pytest.fixture
async def client(app):
    """모니터링 서비스 비동기 테스트 클라이언트"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c

@pytest.fixture
def gateway_app():
    """API Gateway 앱 인스턴스"""
    from api_gateway.main import app
    return app

@pytest.fixture
async def gateway_client(gateway_app):
    """API Gateway 비동기 테스트 클라이언트"""
    async with AsyncClient(
        transport=ASGITransport(app=gateway_app),
        base_url="http://test",
    ) as c:
        yield c

# ── 공통 모킹 픽스처 ──

@pytest.fixture
def mock_redis():
    """Redis AsyncMock — 모든 Redis 작업을 모킹"""
    redis = AsyncMock()
    redis.get.return_value = None
    redis.set.return_value = True
    redis.ping.return_value = True
    redis.incr.return_value = 1
    redis.expire.return_value = True
    return redis

@pytest.fixture
def mock_prometheus_response():
    """Prometheus 응답 팩토리 — 커스텀 메트릭 데이터 생성"""
    def _factory(result_data):
        return {
            "status": "success",
            "data": {"resultType": "matrix", "result": result_data},
        }
    return _factory
```

### 3.6 테스트 작성 패턴

#### 라우터 엔드포인트 테스트

```python
# tests/unit/monitoring/test_metrics_router.py
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_query_range_returns_metrics(client, mock_redis):
    """PromQL 범위 쿼리가 메트릭 데이터를 반환하는지 검증"""
    mock_data = [{"metric": {"__name__": "cpu_usage"}, "values": [[1, "0.5"]]}]

    with patch("monitoring_svc.routers.metrics.get_redis", return_value=mock_redis):
        with patch("monitoring_svc.routers.metrics.PrometheusClient") as MockProm:
            instance = AsyncMock()
            instance.query_range.return_value = mock_data
            MockProm.return_value = instance

            response = await client.get(
                "/metrics/query_range",
                params={
                    "query": "cpu_usage",
                    "start": "2024-01-01T00:00:00Z",
                    "end": "2024-01-01T01:00:00Z",
                    "step": "15s",
                },
            )

    assert response.status_code == 200
    assert response.json() == mock_data
```

#### 클라이언트 모듈 테스트

```python
# tests/unit/pipeline/test_airbyte.py
import pytest
from unittest.mock import AsyncMock, patch
import httpx

@pytest.mark.asyncio
async def test_list_connections():
    """Airbyte 연결 목록을 정상적으로 조회하는지 검증"""
    mock_response = httpx.Response(
        200,
        json={"connections": [{"connectionId": "abc-123", "name": "test"}]},
    )

    with patch("pipeline_svc.clients.airbyte.httpx.AsyncClient") as MockClient:
        instance = AsyncMock()
        instance.post.return_value = mock_response
        MockClient.return_value.__aenter__ = AsyncMock(return_value=instance)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

        from pipeline_svc.clients.airbyte import AirbyteClient
        client = AirbyteClient()
        result = await client.list_connections()

    assert len(result) == 1
    assert result[0]["connectionId"] == "abc-123"
```

#### 헬스체크 테스트

```python
# tests/unit/serving/test_health.py
import pytest

@pytest.mark.asyncio
async def test_health_returns_ok(serving_client):
    """서비스 헬스체크가 정상 응답을 반환하는지 검증"""
    resp = await serving_client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "timestamp" in body
    assert "version" in body
```

#### 인증 모듈 테스트

```python
# tests/unit/shared/test_auth.py
import pytest
from unittest.mock import patch, MagicMock

def test_determine_role_admin():
    """admin 그룹 사용자에게 admin 역할을 부여하는지 검증"""
    from shared.auth import _determine_role
    assert _determine_role(["admin", "ml-engineer"]) == "admin"

def test_determine_role_viewer_default():
    """그룹이 없는 사용자에게 viewer 역할을 부여하는지 검증"""
    from shared.auth import _determine_role
    assert _determine_role([]) == "viewer"

@pytest.mark.asyncio
async def test_get_current_user_no_token():
    """토큰 없이 요청하면 anonymous viewer가 반환되는지 검증"""
    from shared.auth import get_current_user
    from unittest.mock import MagicMock

    request = MagicMock()
    request.headers = {}

    user = await get_current_user(request)
    assert user.sub == "anonymous"
    assert user.role == "viewer"
```

### 3.7 유용한 pytest 옵션

```bash
# 실패한 테스트만 재실행
pytest --lf

# 첫 번째 실패에서 중단
pytest -x

# 특정 마커로 필터링
pytest -m "not slow"

# 출력 캡처 비활성화 (print 확인용)
pytest -s

# 병렬 실행 (pytest-xdist 설치 필요)
pytest -n auto
```

---

## 4. E2E 테스트

### 4.1 기술 스택

| 도구 | 버전 | 용도 |
|------|------|------|
| @playwright/test | ^1.45.0 | 브라우저 E2E 테스트 프레임워크 |

### 4.2 사전 준비

```bash
# E2E 디렉토리로 이동
cd e2e

# 의존성 설치
pnpm install

# Playwright 브라우저 설치
npx playwright install
```

E2E 테스트를 실행하기 전에 전체 서비스가 구동되어야 합니다:

```bash
# 프로젝트 루트에서 Docker Compose로 전체 서비스 실행
cd mlops-platform
docker compose up -d

# 서비스가 준비될 때까지 대기 (헬스체크 확인)
curl http://localhost:8000/health
curl http://localhost:5173
```

### 4.3 테스트 실행 명령어

```bash
cd e2e

# 헤드리스 모드 (CI용)
pnpm test

# 브라우저 화면 표시 (디버깅용)
pnpm test:headed

# Playwright UI 모드 (인터랙티브 디버깅)
pnpm test:ui

# 특정 테스트 파일만 실행
npx playwright test tests/monitoring.spec.ts

# 특정 브라우저만 실행
npx playwright test --project=chromium

# HTML 리포트 보기
pnpm report
```

### 4.4 Playwright 설정

```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,                              // 로컬에서 병렬 실행
  forbidOnly: !!process.env.CI,                      // CI에서 .only 금지
  retries: process.env.CI ? 2 : 0,                   // CI에서 2회 재시도
  workers: process.env.CI ? 1 : undefined,            // CI에서 순차 실행
  reporter: [['html'], ['list']],                     // HTML + 콘솔 리포터
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',                          // 재시도 시에만 트레이스
    screenshot: 'only-on-failure',                    // 실패 시에만 스크린샷
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
```

### 4.5 인증 픽스처

```typescript
// e2e/fixtures/auth.ts
import { test as base, Page } from '@playwright/test';

const credentials = {
  admin: { email: 'admin@company.com', password: '...' },
  'ml-engineer': { email: 'engineer@company.com', password: '...' },
  'data-engineer': { email: 'data@company.com', password: '...' },
  viewer: { email: 'viewer@company.com', password: '...' },
};

async function loginAsUser(page: Page, role: string) {
  const cred = credentials[role];
  await page.goto('/login');
  await page.fill('[data-testid=email]', cred.email);
  await page.fill('[data-testid=password]', cred.password);
  await page.click('[data-testid=login-button]');
  await page.waitForURL('**/monitoring/**');
}

export const test = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ page }, use) => {
    await loginAsUser(page, 'admin');
    await use(page);
  },
});
```

### 4.6 E2E 테스트 작성 패턴

```typescript
// e2e/tests/monitoring.spec.ts
import { test } from '../fixtures/auth';
import { expect } from '@playwright/test';

test.describe('모니터링', () => {
  test('클러스터 개요 페이지를 표시한다', async ({ loggedInPage: page }) => {
    await page.goto('/monitoring/cluster');
    await expect(page.getByText('Cluster Overview')).toBeVisible();
  });

  test('메트릭 탐색기에서 그래프를 렌더링한다', async ({ loggedInPage: page }) => {
    await page.goto('/monitoring/metrics');
    await expect(page.locator('canvas, svg')).toBeVisible();
  });

  test('알림 목록을 표시한다', async ({ loggedInPage: page }) => {
    await page.goto('/monitoring/alerts');
    await expect(page.getByText('Alerts')).toBeVisible();
  });
});
```

### 4.7 디버깅 팁

```bash
# 트레이스 뷰어로 실패한 테스트 분석
npx playwright show-trace trace.zip

# 특정 테스트를 디버그 모드로 실행
npx playwright test --debug tests/monitoring.spec.ts

# 코드 생성기로 테스트 자동 작성
npx playwright codegen http://localhost:5173
```

---

## 5. CI/CD에서의 테스트

### GitHub Actions 워크플로우

`.github/workflows/ci.yml`에서 프론트엔드와 백엔드 테스트가 **병렬**로 실행됩니다:

```
┌─────────────────────────────────────────┐
│          Push / PR to main, develop      │
├──────────────────┬──────────────────────┤
│  Frontend Job    │   Backend Job         │
│  (병렬 실행)      │   (병렬 실행)          │
├──────────────────┼──────────────────────┤
│ 1. pnpm install  │ 1. pip install        │
│ 2. lint (ESLint) │ 2. lint (ruff check)  │
│ 3. test:coverage │ 3. pytest + coverage  │
│ 4. Codecov 업로드 │ 4. Codecov 업로드      │
└──────────────────┴──────────────────────┘
```

### 프론트엔드 CI Job

```yaml
frontend:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v3
      with: { version: 8 }
    - uses: actions/setup-node@v4
      with: { node-version: 20, cache: 'pnpm' }
    - run: pnpm install --frozen-lockfile
    - run: pnpm --filter frontend lint
    - run: pnpm --filter frontend test:coverage
    - uses: codecov/codecov-action@v4
```

### 백엔드 CI Job

```yaml
backend:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with: { python-version: '3.11', cache: 'pip' }
    - run: pip install -r packages/backend/requirements.dev.txt
    - run: ruff check packages/backend/
    - run: pytest packages/backend/tests/unit/ -v --cov --cov-report=xml
    - uses: codecov/codecov-action@v4
```

---

## 빠른 참조 (명령어 요약)

| 작업 | 명령어 |
|------|--------|
| **프론트엔드 테스트** | `pnpm --filter frontend test` |
| **프론트엔드 워치 모드** | `pnpm --filter frontend test:watch` |
| **프론트엔드 커버리지** | `pnpm --filter frontend test:coverage` |
| **백엔드 전체 테스트** | `pytest packages/backend/tests/unit/ -v` |
| **백엔드 커버리지** | `pytest packages/backend/tests/unit/ -v --cov` |
| **백엔드 특정 서비스** | `pytest packages/backend/tests/unit/monitoring/ -v` |
| **백엔드 린팅** | `ruff check packages/backend/` |
| **백엔드 포매팅** | `black --check packages/backend/` |
| **백엔드 타입 검사** | `mypy packages/backend/` |
| **E2E 테스트 (헤드리스)** | `cd e2e && pnpm test` |
| **E2E 테스트 (브라우저)** | `cd e2e && pnpm test:headed` |
| **E2E UI 모드** | `cd e2e && pnpm test:ui` |
| **E2E 리포트** | `cd e2e && pnpm report` |
| **전체 린트** | `pnpm -r lint` |
| **전체 테스트** | `pnpm -r test` |
