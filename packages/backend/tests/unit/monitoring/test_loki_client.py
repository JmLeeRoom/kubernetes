"""Tests for the LokiClient."""

from __future__ import annotations

import httpx
import pytest
import respx

from monitoring_svc.clients.loki import LokiClient


@pytest.mark.asyncio
@respx.mock
async def test_query():
    """LokiClient.query returns Loki API response."""
    respx.get("http://loki:3100/loki/api/v1/query_range").mock(
        return_value=httpx.Response(
            200,
            json={
                "status": "success",
                "data": {"result": []},
            },
        )
    )
    client = LokiClient("http://loki:3100")
    result = await client.query('{app="test"}')
    assert isinstance(result, dict)
    await client.close()
