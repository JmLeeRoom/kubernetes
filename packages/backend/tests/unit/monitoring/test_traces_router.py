"""Tests for the traces router."""

from __future__ import annotations

import httpx
import pytest
import respx

from httpx import AsyncClient


@pytest.mark.asyncio
@respx.mock
async def test_trace_search(client: AsyncClient, mock_redis):
    """GET /traces/search returns Tempo search results."""
    respx.get("http://tempo:3200/api/search").mock(
        return_value=httpx.Response(200, json={"traces": []})
    )
    resp = await client.get("/traces/search", params={"service_name": "test"})
    assert resp.status_code == 200


@pytest.mark.asyncio
@respx.mock
async def test_get_trace(client: AsyncClient, mock_redis):
    """GET /traces/{trace_id} returns a single trace."""
    respx.get("http://tempo:3200/api/traces/abc123").mock(
        return_value=httpx.Response(
            200, json={"traceID": "abc123", "spans": []}
        )
    )
    resp = await client.get("/traces/abc123")
    assert resp.status_code == 200
