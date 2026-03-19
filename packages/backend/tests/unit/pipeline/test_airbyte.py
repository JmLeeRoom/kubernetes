import pytest
import respx
from httpx import Response

from pipeline_svc.clients.airbyte import AirbyteClient
from shared.exceptions import UpstreamError

BASE = "http://airbyte-server:8001"


@pytest.fixture
def airbyte():
    return AirbyteClient(BASE, username="test", password="test")


CONNECTIONS_RESPONSE = {
    "connections": [
        {
            "connectionId": "conn-1",
            "name": "pg-to-snowflake",
            "status": "active",
            "sourceId": "src-1",
            "destinationId": "dst-1",
        },
        {
            "connectionId": "conn-2",
            "name": "mysql-to-s3",
            "status": "inactive",
            "sourceId": "src-2",
            "destinationId": "dst-2",
        },
    ]
}


@pytest.mark.asyncio
@respx.mock
async def test_list_connections(airbyte):
    respx.post(f"{BASE}/v1/connections/list").mock(
        return_value=Response(200, json=CONNECTIONS_RESPONSE)
    )
    result = await airbyte.list_connections("workspace-1")
    assert len(result) == 2
    assert result[0]["connectionId"] == "conn-1"
    await airbyte.close()


@pytest.mark.asyncio
@respx.mock
async def test_get_connection(airbyte):
    conn = {"connectionId": "conn-1", "name": "pg-to-snowflake", "status": "active"}
    respx.post(f"{BASE}/v1/connections/get").mock(
        return_value=Response(200, json=conn)
    )
    result = await airbyte.get_connection("conn-1")
    assert result["name"] == "pg-to-snowflake"
    await airbyte.close()


@pytest.mark.asyncio
@respx.mock
async def test_trigger_sync(airbyte):
    respx.post(f"{BASE}/v1/connections/sync").mock(
        return_value=Response(200, json={"job": {"id": 42}})
    )
    result = await airbyte.trigger_sync("conn-1")
    assert result["job"]["id"] == 42
    await airbyte.close()


@pytest.mark.asyncio
@respx.mock
async def test_get_jobs(airbyte):
    respx.post(f"{BASE}/v1/jobs/list").mock(
        return_value=Response(200, json={"jobs": [{"id": 1}, {"id": 2}]})
    )
    result = await airbyte.get_jobs("conn-1")
    assert len(result) == 2
    await airbyte.close()


@pytest.mark.asyncio
@respx.mock
async def test_http_error_raises_upstream(airbyte):
    respx.post(f"{BASE}/v1/connections/list").mock(return_value=Response(500))
    with pytest.raises(UpstreamError):
        await airbyte.list_connections("workspace-1")
    await airbyte.close()
