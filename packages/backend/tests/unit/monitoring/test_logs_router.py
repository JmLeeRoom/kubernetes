"""Tests for the logs router."""

from __future__ import annotations

import httpx
import pytest
import respx

from httpx import AsyncClient


@pytest.mark.asyncio
@respx.mock
async def test_logs_query(client: AsyncClient, mock_redis):
    """GET /logs/query returns Loki query results."""
    respx.get("http://loki:3100/loki/api/v1/query_range").mock(
        return_value=httpx.Response(
            200,
            json={
                "status": "success",
                "data": {
                    "result": [
                        {
                            "stream": {"app": "test"},
                            "values": [["1700000000", "log line 1"]],
                        }
                    ]
                },
            },
        )
    )
    resp = await client.get("/logs/query", params={"query": '{app="test"}'})
    assert resp.status_code == 200
