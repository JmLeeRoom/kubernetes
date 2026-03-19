import pytest
import respx
from httpx import Response

from monitoring_svc.clients.prometheus import PrometheusClient
from shared.exceptions import UpstreamError

BASE = "http://prometheus:9090"


@pytest.fixture
def prom():
    return PrometheusClient(BASE)


@pytest.mark.asyncio
@respx.mock
async def test_query_success(prom, mock_prometheus_response):
    payload = mock_prometheus_response(
        "vector",
        [{"metric": {"__name__": "up"}, "value": [1234567890, "1"]}],
    )
    respx.get(f"{BASE}/api/v1/query").mock(return_value=Response(200, json=payload))

    result = await prom.query("up")
    assert result["resultType"] == "vector"
    assert len(result["result"]) == 1
    await prom.close()


@pytest.mark.asyncio
@respx.mock
async def test_query_range_success(prom, mock_prometheus_response):
    payload = mock_prometheus_response(
        "matrix",
        [
            {
                "metric": {"__name__": "cpu_usage"},
                "values": [[1000, "0.5"], [1015, "0.6"]],
            }
        ],
    )
    respx.get(f"{BASE}/api/v1/query_range").mock(return_value=Response(200, json=payload))

    result = await prom.query_range("cpu_usage", "1000", "2000", "15s")
    assert result["resultType"] == "matrix"
    assert len(result["result"]) == 1
    await prom.close()


@pytest.mark.asyncio
@respx.mock
async def test_query_upstream_error(prom):
    payload = {"status": "error", "error": "bad query"}
    respx.get(f"{BASE}/api/v1/query").mock(return_value=Response(200, json=payload))

    with pytest.raises(UpstreamError):
        await prom.query("invalid{")
    await prom.close()


@pytest.mark.asyncio
@respx.mock
async def test_query_http_500(prom):
    respx.get(f"{BASE}/api/v1/query").mock(return_value=Response(500))

    with pytest.raises(UpstreamError):
        await prom.query("up")
    await prom.close()
