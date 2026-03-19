from unittest.mock import AsyncMock, patch

import pytest

CONNECTIONS = [
    {
        "connectionId": "conn-1",
        "name": "pg-to-snowflake",
        "status": "active",
        "sourceId": "src-1",
        "destinationId": "dst-1",
    }
]


@pytest.mark.asyncio
async def test_list_connections_endpoint(pipeline_client, mock_redis):
    with patch("pipeline_svc.routers.airbyte._airbyte") as mock_factory:
        mock_client = AsyncMock()
        mock_client.list_connections = AsyncMock(return_value=CONNECTIONS)
        mock_client.close = AsyncMock()
        mock_factory.return_value = mock_client

        resp = await pipeline_client.get("/connections/")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body) == 1
        assert body[0]["name"] == "pg-to-snowflake"


@pytest.mark.asyncio
async def test_trigger_sync_endpoint(pipeline_client, mock_redis):
    with patch("pipeline_svc.routers.airbyte._airbyte") as mock_factory:
        mock_client = AsyncMock()
        mock_client.trigger_sync = AsyncMock(return_value={"job": {"id": 99}})
        mock_client.close = AsyncMock()
        mock_factory.return_value = mock_client

        resp = await pipeline_client.post("/connections/conn-1/sync")
        assert resp.status_code == 200
        body = resp.json()
        assert body["job"]["id"] == 99
