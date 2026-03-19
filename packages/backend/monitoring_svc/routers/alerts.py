"""Alert management endpoints backed by Prometheus and Alertmanager."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

from monitoring_svc.clients.prometheus import PrometheusClient
from monitoring_svc.config import settings
from shared.exceptions import UpstreamError

router = APIRouter()


def _prom() -> PrometheusClient:
    return PrometheusClient(settings.prometheus_url)


class SilenceRequest(BaseModel):
    duration_hours: int = 2
    comment: str = "Silenced from MLOps dashboard"
    created_by: str = "mlops-platform"


@router.get("/")
async def list_alerts() -> list[dict[str, Any]]:
    """Query Prometheus ALERTS metric to get active alerts."""
    prom = _prom()
    try:
        data = await prom.query("ALERTS{alertstate='firing'}")
        results = data.get("result", [])
        return [
            {
                "alertname": r["metric"].get("alertname", "unknown"),
                "severity": r["metric"].get("severity", "unknown"),
                "state": r["metric"].get("alertstate", "unknown"),
                "labels": r["metric"],
                "value": r["value"][1] if r.get("value") else None,
            }
            for r in results
        ]
    finally:
        await prom.close()


@router.post("/{alert_id}/silence")
async def silence_alert(alert_id: str, body: SilenceRequest | None = None) -> dict[str, Any]:
    """Create a silence in Alertmanager for a specific alert."""
    req = body or SilenceRequest()
    now = datetime.now(timezone.utc)
    ends_at = now + timedelta(hours=req.duration_hours)

    silence_payload = {
        "matchers": [{"name": "alertname", "value": alert_id, "isRegex": False}],
        "startsAt": now.isoformat(),
        "endsAt": ends_at.isoformat(),
        "createdBy": req.created_by,
        "comment": req.comment,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{settings.alertmanager_url}/api/v2/silences",
                json=silence_payload,
            )
            resp.raise_for_status()
            return {"status": "silenced", "alert_id": alert_id, "silence_id": resp.json().get("silenceID", "")}
    except httpx.HTTPError as exc:
        raise UpstreamError("alertmanager", str(exc)) from exc
