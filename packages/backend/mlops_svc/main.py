from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mlops_svc.config import settings
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
        title="MLOps Service",
        version=settings.version,
        description=(
            "ML experiment tracking and workflow orchestration service.\n\n"
            "Integrates with:\n"
            "- **MLflow**: Experiment listing, run comparison, model registry, and stage transitions\n"
            "- **Airflow**: DAG listing, triggering, pause/unpause, task graph, and run history\n"
            "- **Lineage**: Artifact provenance tracing across experiments"
        ),
        lifespan=lifespan,
        openapi_tags=[
            {"name": "mlflow", "description": "MLflow experiments, runs, model registry, and stage transitions"},
            {"name": "airflow", "description": "Airflow DAG management, triggering, and run history"},
            {"name": "lineage", "description": "Data lineage and artifact provenance tracking"},
        ],
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from mlops_svc.routers import airflow, lineage, mlflow

    app.include_router(mlflow.router, prefix="/experiments", tags=["mlflow"])
    app.include_router(airflow.router, prefix="/dags", tags=["airflow"])
    app.include_router(lineage.router, prefix="/lineage", tags=["lineage"])

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(
            service=settings.service_name,
            version=settings.version,
            timestamp=datetime.now(timezone.utc),
        )

    return app


app = create_app()
