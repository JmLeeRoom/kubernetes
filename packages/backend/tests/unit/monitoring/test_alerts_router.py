"""Tests for the alerts router."""

from __future__ import annotations

import httpx
import pytest
import respx

from httpx import AsyncClient


@pytest.mark.asyncio
@respx.mock
async def test_list_alerts(client: AsyncClient, mock_redis):
    """GET /alerts/ returns active alerts from Prometheus."""
    respx.get("http://prometheus:9090/api/v1/query").mock(
        return_value=httpx.Response(
            200,
            json={
                "status": "success",
                "data": {
                    "resultType": "vector",
                    "result": [],
                },
            },
        )
    )
    resp = await client.get("/alerts/")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
@respx.mock
async def test_silence_alert(client: AsyncClient, mock_redis):
    """POST /alerts/{alert_id}/silence creates a silence in Alertmanager."""
    respx.post("http://alertmanager:9093/api/v2/silences").mock(
        return_value=httpx.Response(200, json={"silenceID": "s1"})
    )
    resp = await client.post(
        "/alerts/HighCPU/silence",
        json={"duration_hours": 2, "comment": "test"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "silenced"
