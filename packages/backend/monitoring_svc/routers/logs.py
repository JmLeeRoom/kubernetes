from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from monitoring_svc.clients.loki import LokiClient
from monitoring_svc.config import settings

router = APIRouter()


def _loki() -> LokiClient:
    return LokiClient(settings.loki_url)


@router.get("/query")
async def query_logs(
    query: str = Query(..., description="LogQL expression"),
    start: str | None = Query(None),
    end: str | None = Query(None),
    limit: int = Query(100, ge=1, le=5000),
) -> dict:
    loki = _loki()
    try:
        return await loki.query(query, start, end, limit)
    finally:
        await loki.close()


@router.websocket("/stream")
async def stream_logs(ws: WebSocket, query: str = "") -> None:
    """WebSocket bridge that tails Loki logs."""
    await ws.accept()
    loki = _loki()
    try:
        while True:
            try:
                data = await loki.query(query, limit=50)
                await ws.send_text(json.dumps(data))
            except Exception as exc:
                await ws.send_text(json.dumps({"error": str(exc)}))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
    finally:
        await loki.close()
