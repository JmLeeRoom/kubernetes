"""Tests for the API gateway health endpoint."""

from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_health_returns_ok(gateway_client, mock_redis):
    resp = await gateway_client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "api-gateway"


@pytest.mark.asyncio
async def test_health_contains_version(gateway_client, mock_redis):
    resp = await gateway_client.get("/health")
    data = resp.json()
    assert "version" in data
    assert data["version"] == "0.1.0"
