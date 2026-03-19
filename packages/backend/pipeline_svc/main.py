from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pipeline_svc.config import settings
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
        title="Pipeline Service",
        version=settings.version,
        description=(
            "Data pipeline management service for the MLOps Platform.\n\n"
            "Integrates with:\n"
            "- **Airbyte**: Data connection management and sync triggering\n"
            "- **Prefect**: Flow orchestration and run management\n"
            "- **Spark**: Job and stage monitoring"
        ),
        lifespan=lifespan,
        openapi_tags=[
            {"name": "airbyte", "description": "Airbyte data connections, sync triggers, and job history"},
            {"name": "prefect", "description": "Prefect flow listing, run history, and cancellation"},
            {"name": "spark", "description": "Spark application, job, and stage monitoring"},
        ],
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from pipeline_svc.routers import airbyte, prefect, spark

    app.include_router(airbyte.router, prefix="/connections", tags=["airbyte"])
    app.include_router(prefect.router, prefix="/flows", tags=["prefect"])
    app.include_router(spark.router, prefix="/spark", tags=["spark"])

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(
            service=settings.service_name,
            version=settings.version,
            timestamp=datetime.now(timezone.utc),
        )

    return app


app = create_app()
