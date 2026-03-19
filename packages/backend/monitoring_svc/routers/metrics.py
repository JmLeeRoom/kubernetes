from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse

from monitoring_svc.clients.prometheus import PrometheusClient
from monitoring_svc.config import settings
from shared.cache import cache_get, cache_set

router = APIRouter()


def _prom() -> PrometheusClient:
    return PrometheusClient(settings.prometheus_url)


@router.get("/query_range")
async def query_range(
    query: str = Query(..., description="PromQL expression"),
    start: str = Query(...),
    end: str = Query(...),
    step: str = Query("15s"),
) -> dict:
    cache_key = f"prom:range:{query}:{start}:{end}:{step}"
    cached = None
    try:
        cached = await cache_get(cache_key)
    except Exception:
        pass
    if cached is not None:
        return cached

    prom = _prom()
    try:
        data = await prom.query_range(query, start, end, step)
    finally:
        await prom.close()

    try:
        await cache_set(cache_key, data, ttl=settings.cache_ttl)
    except Exception:
        pass
    return data


@router.get("/stream")
async def stream_metrics(
    request: Request,
    query: str = Query(..., description="PromQL expression"),
    interval: int = Query(5, ge=1, le=60),
) -> StreamingResponse:
    """SSE endpoint that periodically pushes metric snapshots."""

    async def event_generator():
        prom = _prom()
        try:
            while not await request.is_disconnected():
                try:
                    data = await prom.query(query)
                    yield f"data: {json.dumps(data)}\n\n"
                except Exception as exc:
                    yield f"event: error\ndata: {json.dumps({'error': str(exc)})}\n\n"
                await asyncio.sleep(interval)
        finally:
            await prom.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
