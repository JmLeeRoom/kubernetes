# Frontend Testing Guide

> How to run, write, and debug tests for the MLOps Platform frontend

---

## Prerequisites

- **Node.js** 20.0.0+
- **pnpm** 8+

```bash
# Install dependencies (from project root)
pnpm install
```

---

## 1. Running Tests

All commands are run from `packages/frontend/`:

```bash
cd packages/frontend

# Run all tests once
pnpm test

# Watch mode — re-runs on file changes
pnpm test:watch

# Run with coverage report
pnpm test:coverage

# Run a specific test file
npx vitest run src/lib/__tests__/auth.test.ts

# Run tests matching a pattern
npx vitest run --grep "renders heading"

# Run tests for a specific feature
npx vitest run src/features/monitoring/
```

### From the project root

```bash
# Run frontend tests via workspace filter
pnpm --filter frontend test
pnpm --filter frontend test:coverage
```

---

## 2. Test Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner (Vite-native, fast HMR-based re-runs) |
| **jsdom** | Browser environment simulation |
| **@testing-library/react** | Component rendering and DOM queries |
| **@testing-library/user-event** | Simulating user interactions (click, type, etc.) |
| **MSW (Mock Service Worker)** | Network-level API mocking |
| **@faker-js/faker** | Realistic mock data generation |
| **@vitest/coverage-v8** | Code coverage via V8 |

---

## 3. Test Configuration

### Vitest config (`vite.config.ts`)

```typescript
test: {
  globals: true,          // no need to import describe/it/expect
  environment: 'jsdom',   // simulates browser DOM
  setupFiles: './src/test/setup.ts',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov'],
    thresholds: { lines: 80, functions: 80, branches: 75 },
    exclude: [
      'src/mocks/**',
      'src/components/ui/**',
      'src/main.tsx',
      'src/app/providers.tsx',
      'src/app/router.tsx',
    ],
  },
},
```

### Global setup (`src/test/setup.ts`)

The setup file initializes MSW before tests and cleans up after:

```typescript
import '@testing-library/jest-dom';
import { server } from '../mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());  // reset between tests for isolation
afterAll(() => server.close());
```

---

## 4. Writing Tests

### 4.1 Component Tests

Always use `renderWithProviders()` instead of bare `render()` — it wraps your component with `QueryClientProvider` and `MemoryRouter`.

```typescript
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders data from API', async () => {
    renderWithProviders(<MyComponent />);
    await waitFor(() => {
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  it('shows skeleton while loading', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });
});
```

**With a specific route:**

```typescript
renderWithProviders(<MyComponent />, { route: '/dashboard' });
```

### 4.2 Testing Error States with MSW Override

Override default MSW handlers in individual tests to simulate API errors:

```typescript
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

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
```

### 4.3 Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useSSE } from '../useSSE';

describe('useSSE', () => {
  it('connects to EventSource', () => {
    const mockEventSource = vi.fn();
    vi.stubGlobal('EventSource', mockEventSource);

    renderHook(() => useSSE('/api/v1/metrics/stream'));
    expect(mockEventSource).toHaveBeenCalledWith('/api/v1/metrics/stream');
  });
});
```

### 4.4 Store Tests (Zustand)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  it('sets user on login', () => {
    useAuthStore.getState().login({ token: 'abc', user: { name: 'test' } });
    expect(useAuthStore.getState().user).toEqual({ name: 'test' });
  });
});
```

### 4.5 Utility / Library Tests

```typescript
import { describe, it, expect } from 'vitest';
import { formatBytes, formatDuration } from '../formatters';

describe('formatBytes', () => {
  it('formats bytes to human-readable string', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1048576)).toBe('1.00 MB');
  });
});
```

---

## 5. MSW (Mock Service Worker) Setup

MSW intercepts HTTP requests at the network level, so your components use real `axios`/`fetch` calls — no need to mock modules.

### Handler structure

```
src/mocks/
├── browser.ts          # MSW browser setup (for dev mode)
├── server.ts           # MSW node setup (for tests)
└── handlers/
    ├── auth.ts         # Auth API mocks
    ├── monitoring.ts   # Monitoring API mocks
    ├── pipeline.ts     # Pipeline API mocks
    ├── serving.ts      # Serving API mocks
    └── mlops.ts        # MLOps API mocks
```

### Rules

- When adding a new API endpoint, **always** add a corresponding MSW handler.
- Mock at the **network level** — do NOT use `vi.mock()` on API modules.
- Use `faker` to generate realistic response data.

---

## 6. Test File Organization

Test files live in `__tests__/` directories alongside the source:

```
src/
├── components/layout/__tests__/
│   └── TopNav.test.tsx
├── features/
│   ├── auth/__tests__/
│   │   ├── LoginPage.test.tsx
│   │   └── ProtectedRoute.test.tsx
│   ├── monitoring/__tests__/
│   │   ├── MetricsExplorerPage.test.tsx
│   │   ├── LogViewerPage.test.tsx
│   │   └── TraceExplorerPage.test.tsx
│   ├── pipeline/__tests__/
│   │   └── ConnectionsPage.test.tsx
│   ├── serving/__tests__/
│   │   ├── InferenceServicesPage.test.tsx
│   │   └── TrafficSplitPage.test.tsx
│   └── mlops/__tests__/
│       ├── ExperimentsPage.test.tsx
│       └── DAGListPage.test.tsx
├── stores/__tests__/
│   ├── authStore.test.ts
│   ├── uiStore.test.ts
│   └── clusterStore.test.ts
├── hooks/__tests__/
│   ├── useSSE.test.ts
│   ├── useWebSocket.test.ts
│   └── usePermission.test.ts
└── lib/__tests__/
    ├── auth.test.ts
    ├── api.test.ts
    └── formatters.test.ts
```

---

## 7. Coverage

### Thresholds (enforced in CI)

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Functions | 80% |
| Branches | 75% |

### Viewing coverage

```bash
pnpm test:coverage
```

This generates:
- **Terminal** — text summary printed to stdout
- **`coverage/lcov-report/index.html`** — open in a browser for a detailed, interactive report

### What's excluded from coverage

- `src/mocks/**` — test infrastructure
- `src/components/ui/**` — third-party shadcn/ui wrappers
- `src/main.tsx`, `src/app/providers.tsx`, `src/app/router.tsx` — app bootstrap
- `vite.config.ts`, `src/vite-env.d.ts` — config files

---

## 8. CI Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR to `main` and `develop`:

```yaml
Frontend Job:
  - pnpm install --frozen-lockfile
  - pnpm --filter frontend lint
  - pnpm --filter frontend test:coverage
  - Upload coverage to Codecov
```

### Simulate CI locally

```bash
cd packages/frontend
pnpm lint && pnpm test:coverage
```

---

## 9. Troubleshooting

### `act()` warnings in test output

Wrap assertions in `waitFor` when component state updates asynchronously:

```typescript
await waitFor(() => {
  expect(screen.getByText('loaded')).toBeInTheDocument();
});
```

### `unhandled request` warning from MSW

A component is making an API call with no matching MSW handler. Add the handler in `src/mocks/handlers/`.

### React Router Future Flag warnings

These don't affect test results. They will be resolved when migrating to React Router v7.

### Tests pass locally but fail in CI

1. Ensure `pnpm install --frozen-lockfile` reproduces the same lockfile.
2. Check for tests relying on local timezone or locale — use fixed values.
3. Run `pnpm test:coverage` locally to match CI behavior.

### Coverage below threshold

The build will fail if coverage drops below the configured thresholds. Run `pnpm test:coverage` and check the report to identify uncovered lines, then add tests for them.
