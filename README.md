# MLOps Platform

Integrated Kubernetes-based MLOps dashboard that unifies monitoring, data pipelines, model serving, and experiment tracking into a single control plane.

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────────────┐
│  Frontend    │────▶│  API Gateway (:8000)                             │
│  React SPA   │     │  JWT auth · rate limiting · structured logging  │
└─────────────┘     └────────┬────────┬────────┬────────┬─────────────┘
                             │        │        │        │
                    ┌────────▼──┐ ┌───▼────┐ ┌─▼─────┐ ┌▼──────────┐
                    │Monitoring │ │Pipeline│ │Serving│ │  MLOps    │
                    │  :8001    │ │ :8002  │ │ :8003 │ │  :8004    │
                    └───────────┘ └────────┘ └───────┘ └───────────┘
```

### Services

| Service | Port | Upstream Integrations |
|---------|------|-----------------------|
| API Gateway | 8000 | Proxies to all services, Keycloak SSO |
| Monitoring | 8001 | Prometheus, Loki, Tempo, Alertmanager, K8s API |
| Pipeline | 8002 | Airbyte, Prefect, Spark |
| Serving | 8003 | KServe, Prometheus |
| MLOps | 8004 | MLflow, Airflow |

## Tech Stack

**Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Router 6

**Backend**: FastAPI, Python 3.11+, httpx, pydantic, structlog, Redis

**Infrastructure**: Kubernetes, Helm, Keycloak + OAuth2-Proxy, Nginx Ingress

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm 8+
- Python 3.11+ with `uv` or `pip`
- Docker (for containerized development)
- Kubernetes cluster (for full deployment)

### Development Setup

```bash
# Install frontend dependencies
pnpm install

# Start frontend dev server
cd packages/frontend
pnpm dev

# Set up backend
cd packages/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

# Run a backend service
uvicorn api_gateway.main:app --port 8000 --reload
uvicorn monitoring_svc.main:app --port 8001 --reload
```

### Running Tests

```bash
# Frontend unit tests
cd packages/frontend
pnpm test

# Backend unit tests
cd packages/backend
pytest tests/unit/ -v

# E2E tests (requires running app)
cd e2e
pnpm test
```

### Helm Deployment

```bash
helm install mlops-platform charts/mlops-platform/ \
  --namespace mlops-system \
  --create-namespace \
  -f charts/mlops-platform/values.yaml
```

## Project Structure

```
mlops-platform/
├── packages/frontend/     # React 18 SPA (TypeScript, Vite)
├── packages/backend/      # FastAPI microservices (Python 3.11+)
│   ├── api_gateway/       # :8000 — entry point, auth, routing
│   ├── monitoring_svc/    # :8001 — Prometheus, Loki, Tempo, K8s
│   ├── pipeline_svc/      # :8002 — Airbyte, Prefect, Spark
│   ├── serving_svc/       # :8003 — KServe CRD operations
│   ├── mlops_svc/         # :8004 — MLflow, Airflow
│   └── shared/            # auth, cache, exceptions, logging
├── charts/                # Helm charts for K8s deployment
├── e2e/                   # Playwright end-to-end tests
└── docs/adr/              # Architecture Decision Records
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Frontend API base URL |
| `GATEWAY_*` | API Gateway settings |
| `MONITORING_*` | Monitoring service settings |
| `AUTH_*` | Keycloak authentication settings |

See `.env.example` for the complete list.

## Contributing

1. Create a feature branch: `feat/TASK-XXX-description`
2. Follow TDD: write failing test → implement → refactor
3. Use conventional commits: `feat(scope): description`
4. Ensure `0` lint warnings and `100%` test pass rate
5. Open a PR against `develop`

## License

Proprietary — Internal use only.
