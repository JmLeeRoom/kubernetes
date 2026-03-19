import pytest
import respx
from httpx import Response

from pipeline_svc.clients.prefect import PrefectClient
from shared.exceptions import UpstreamError

BASE = "http://prefect-server:4200"


@pytest.fixture
def prefect():
    return PrefectClient(BASE)


FLOWS = [
    {"id": "flow-1", "name": "etl-daily-sales", "created": "2026-01-01T00:00:00Z"},
    {"id": "flow-2", "name": "ml-feature-pipeline", "created": "2026-01-02T00:00:00Z"},
]

FLOW_RUNS = [
    {
        "id": "run-1",
        "name": "run-abc",
        "flow_id": "flow-1",
        "state": {"type": "COMPLETED"},
        "start_time": "2026-03-01T10:00:00Z",
    },
    {
        "id": "run-2",
        "name": "run-def",
        "flow_id": "flow-1",
        "state": {"type": "RUNNING"},
        "start_time": "2026-03-01T11:00:00Z",
    },
]


@pytest.mark.asyncio
@respx.mock
async def test_list_flows(prefect):
    respx.post(f"{BASE}/api/flows/filter").mock(
        return_value=Response(200, json=FLOWS)
    )
    result = await prefect.list_flows()
    assert len(result) == 2
    assert result[0]["name"] == "etl-daily-sales"
    await prefect.close()


@pytest.mark.asyncio
@respx.mock
async def test_list_flow_runs(prefect):
    respx.post(f"{BASE}/api/flow_runs/filter").mock(
        return_value=Response(200, json=FLOW_RUNS)
    )
    result = await prefect.list_flow_runs()
    assert len(result) == 2
    assert result[1]["state"]["type"] == "RUNNING"
    await prefect.close()


@pytest.mark.asyncio
@respx.mock
async def test_cancel_flow_run(prefect):
    respx.post(f"{BASE}/api/flow_runs/run-2/set_state").mock(
        return_value=Response(200, json={"status": "ok"})
    )
    await prefect.cancel_flow_run("run-2")
    await prefect.close()


@pytest.mark.asyncio
@respx.mock
async def test_http_error_raises_upstream(prefect):
    respx.post(f"{BASE}/api/flows/filter").mock(return_value=Response(500))
    with pytest.raises(UpstreamError):
        await prefect.list_flows()
    await prefect.close()
