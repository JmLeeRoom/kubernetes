"""Reverse-proxy to the monitoring microservice."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse

from api_gateway.config import settings

router = APIRouter()


async def _proxy(request: Request, path: str) -> StreamingResponse | JSONResponse:
    url = f"{settings.monitoring_svc_url}/{path}"
    params = dict(request.query_params)
    headers = {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in ("host", "content-length")
    }

    try:
        async with httpx.AsyncClient(timeout=settings.proxy_timeout) as client:
            body = await request.body()
            resp = await client.request(
                method=request.method,
                url=url,
                params=params,
                headers=headers,
                content=body if body else None,
            )
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        return JSONResponse(
            {"detail": f"Upstream monitoring-svc unavailable: {exc}"},
            status_code=502,
        )

    return StreamingResponse(
        iter([resp.content]),
        status_code=resp.status_code,
        headers=dict(resp.headers),
        media_type=resp.headers.get("content-type"),
    )


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_monitoring(request: Request, path: str) -> StreamingResponse:
    """Forward all /api/v1/monitoring/* requests to the monitoring service."""
    return await _proxy(request, path)
