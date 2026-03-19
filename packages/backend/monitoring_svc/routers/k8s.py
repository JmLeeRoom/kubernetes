from __future__ import annotations

import json

from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse

from monitoring_svc.clients.k8s_client import K8sClient
from monitoring_svc.config import settings

router = APIRouter()


def _k8s() -> K8sClient:
    return K8sClient(in_cluster=settings.k8s_in_cluster, namespace=settings.k8s_namespace)


@router.get("/nodes")
async def list_nodes() -> list[dict]:
    k = _k8s()
    return k.list_nodes()


@router.get("/pods")
async def list_pods(namespace: str | None = Query(None)) -> list[dict]:
    k = _k8s()
    return k.list_pods(namespace)


@router.get("/events")
async def stream_events(
    request: Request,
    namespace: str | None = Query(None),
) -> StreamingResponse:
    """SSE stream of K8s events."""

    async def event_generator():
        k = _k8s()
        async for event in k.watch_events(namespace):
            if await request.is_disconnected():
                break
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
