"""Tests for the TempoClient."""

from __future__ import annotations

import httpx
import pytest
import respx

from monitoring_svc.clients.tempo import TempoClient


@pytest.mark.asyncio
@respx.mock
async def test_get_trace():
    """TempoClient.get_trace returns trace by ID."""
    respx.get("http://tempo:3200/api/traces/abc123").mock(
        return_value=httpx.Response(
            200, json={"traceID": "abc123", "spans": []}
        )
    )
    client = TempoClient("http://tempo:3200")
    result = await client.get_trace("abc123")
    assert "traceID" in result
    await client.close()


@pytest.mark.asyncio
@respx.mock
async def test_search_traces():
    """TempoClient.search_traces returns search results."""
    respx.get("http://tempo:3200/api/search").mock(
        return_value=httpx.Response(200, json={"traces": []})
    )
    client = TempoClient("http://tempo:3200")
    result = await client.search_traces(service_name="test")
    assert "traces" in result
    await client.close()
