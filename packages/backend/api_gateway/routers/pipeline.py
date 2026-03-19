"""Reverse-proxy to the pipeline microservice."""

from __future__ import annotations

from fastapi import APIRouter, Request

from api_gateway.config import settings
from api_gateway.proxy import forward

router = APIRouter()


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_pipeline(request: Request, path: str):
    """Forward all /api/v1/pipeline/* requests to the pipeline service."""
    return await forward(
        request, path, upstream_url=settings.pipeline_svc_url, service_name="pipeline-svc"
    )
