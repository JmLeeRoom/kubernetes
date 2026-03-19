"""API Gateway – single entry point for the MLOps platform."""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api_gateway.config import settings
from api_gateway.middleware.auth import AuthMiddleware
from api_gateway.middleware.logging import LoggingMiddleware
from api_gateway.middleware.rate_limit import RateLimitMiddleware
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
        title="MLOps Platform API Gateway",
        version=settings.version,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(AuthMiddleware)
    app.add_middleware(
        RateLimitMiddleware,
        max_requests=settings.rate_limit_requests,
        window_seconds=settings.rate_limit_window,
    )

    from api_gateway.routers import auth, mlops, monitoring, pipeline, serving

    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(monitoring.router, prefix="/api/v1/monitoring", tags=["monitoring"])
    app.include_router(pipeline.router, prefix="/api/v1/pipeline", tags=["pipeline"])
    app.include_router(serving.router, prefix="/api/v1/serving", tags=["serving"])
    app.include_router(mlops.router, prefix="/api/v1/mlops", tags=["mlops"])

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(
            service=settings.service_name,
            version=settings.version,
            timestamp=datetime.now(timezone.utc),
        )

    return app


app = create_app()
