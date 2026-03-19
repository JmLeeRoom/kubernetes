"""Reverse-proxy to the monitoring microservice."""

from __future__ import annotations

from fastapi import APIRouter, Request

from api_gateway.config import settings
from api_gateway.proxy import forward

router = APIRouter()


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_monitoring(request: Request, path: str):
    """Forward all /api/v1/monitoring/* requests to the monitoring service."""
    return await forward(
        request, path, upstream_url=settings.monitoring_svc_url, service_name="monitoring-svc"
    )
