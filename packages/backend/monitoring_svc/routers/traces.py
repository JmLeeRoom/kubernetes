from __future__ import annotations

from fastapi import APIRouter, Query

from monitoring_svc.clients.tempo import TempoClient
from monitoring_svc.config import settings

router = APIRouter()


def _tempo() -> TempoClient:
    return TempoClient(settings.tempo_url)


@router.get("/search")
async def search_traces(
    service_name: str | None = Query(None),
    operation: str | None = Query(None),
    min_duration: str | None = Query(None),
    max_duration: str | None = Query(None),
    limit: int = Query(20, ge=1, le=200),
) -> dict:
    tempo = _tempo()
    try:
        return await tempo.search_traces(
            service_name=service_name,
            operation=operation,
            min_duration=min_duration,
            max_duration=max_duration,
            limit=limit,
        )
    finally:
        await tempo.close()


@router.get("/{trace_id}")
async def get_trace(trace_id: str) -> dict:
    tempo = _tempo()
    try:
        return await tempo.get_trace(trace_id)
    finally:
        await tempo.close()
