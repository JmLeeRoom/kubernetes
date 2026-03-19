from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from monitoring_svc.config import settings
from shared.cache import close_redis, init_redis
from shared.logging import configure_logging, get_logger
from shared.models import HealthResponse

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    configure_logging(json_format=not settings.debug)
    try:
        await init_redis(settings.redis_url)
    except Exception:
        logger.warning("redis_unavailable", url=settings.redis_url)
    logger.info("startup_complete", service=settings.service_name)
    yield
    await close_redis()
    logger.info("shutdown_complete", service=settings.service_name)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Monitoring Service",
        version=settings.version,
        description=(
            "Observability service for the MLOps Platform.\n\n"
            "Provides unified access to:\n"
            "- **Metrics**: PromQL queries and SSE streaming from Prometheus\n"
            "- **Logs**: LogQL queries and WebSocket tailing from Loki\n"
            "- **Traces**: Distributed trace search from Tempo\n"
            "- **Kubernetes**: Node/pod status and event streaming\n"
            "- **Alerts**: Active alert listing and Alertmanager silence management"
        ),
        lifespan=lifespan,
        openapi_tags=[
            {"name": "metrics", "description": "Prometheus PromQL queries and real-time streaming"},
            {"name": "logs", "description": "Loki LogQL queries and WebSocket log tailing"},
            {"name": "traces", "description": "Tempo distributed trace search and retrieval"},
            {"name": "k8s", "description": "Kubernetes node, pod, and event monitoring"},
            {"name": "alerts", "description": "Prometheus alert listing and Alertmanager silencing"},
        ],
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from monitoring_svc.routers import alerts, k8s, logs, metrics, traces

    app.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
    app.include_router(logs.router, prefix="/logs", tags=["logs"])
    app.include_router(traces.router, prefix="/traces", tags=["traces"])
    app.include_router(k8s.router, prefix="/k8s", tags=["k8s"])
    app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(
            service=settings.service_name,
            version=settings.version,
            timestamp=datetime.now(timezone.utc),
        )

    return app


app = create_app()
