"""Shared reverse-proxy helper used by all gateway routers."""

from __future__ import annotations

import httpx
from fastapi import Request
from fastapi.responses import JSONResponse, StreamingResponse

from api_gateway.config import settings


async def forward(
    request: Request,
    path: str,
    *,
    upstream_url: str,
    service_name: str,
) -> StreamingResponse | JSONResponse:
    """Forward a request to an upstream microservice and stream the response back."""
    url = f"{upstream_url}/{path}"
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
                follow_redirects=True,
            )
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        return JSONResponse(
            {"detail": f"Upstream {service_name} unavailable: {exc}"},
            status_code=502,
        )

    return StreamingResponse(
        iter([resp.content]),
        status_code=resp.status_code,
        headers=dict(resp.headers),
        media_type=resp.headers.get("content-type"),
    )
