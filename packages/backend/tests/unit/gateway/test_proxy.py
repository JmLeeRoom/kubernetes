"""Tests for the proxy routers that forward to downstream services."""

from __future__ import annotations

import pytest
import respx
import httpx


@pytest.mark.asyncio
@respx.mock
async def test_proxy_monitoring_forwards_request(gateway_client, mock_redis):
    """GET /api/v1/monitoring/health should proxy to monitoring-svc."""
    respx.get("http://monitoring-svc:8001/health").mock(
        return_value=httpx.Response(200, json={"status": "ok", "service": "monitoring-svc"})
    )

    resp = await gateway_client.get(
        "/api/v1/monitoring/health",
        headers={"Authorization": "Bearer tok"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["service"] == "monitoring-svc"


@pytest.mark.asyncio
@respx.mock
async def test_proxy_pipeline_forwards_request(gateway_client, mock_redis):
    """GET /api/v1/pipeline/health should proxy to pipeline-svc."""
    respx.get("http://pipeline-svc:8002/health").mock(
        return_value=httpx.Response(200, json={"status": "ok", "service": "pipeline-svc"})
    )

    resp = await gateway_client.get(
        "/api/v1/pipeline/health",
        headers={"Authorization": "Bearer tok"},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
@respx.mock
async def test_proxy_serving_forwards_request(gateway_client, mock_redis):
    """GET /api/v1/serving/health should proxy to serving-svc."""
    respx.get("http://serving-svc:8003/health").mock(
        return_value=httpx.Response(200, json={"status": "ok", "service": "serving-svc"})
    )

    resp = await gateway_client.get(
        "/api/v1/serving/health",
        headers={"Authorization": "Bearer tok"},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
@respx.mock
async def test_proxy_mlops_forwards_request(gateway_client, mock_redis):
    """GET /api/v1/mlops/health should proxy to mlops-svc."""
    respx.get("http://mlops-svc:8004/health").mock(
        return_value=httpx.Response(200, json={"status": "ok", "service": "mlops-svc"})
    )

    resp = await gateway_client.get(
        "/api/v1/mlops/health",
        headers={"Authorization": "Bearer tok"},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
@respx.mock
async def test_proxy_preserves_query_params(gateway_client, mock_redis):
    """Query parameters should be forwarded to the upstream service."""
    route = respx.get("http://monitoring-svc:8001/metrics/query_range").mock(
        return_value=httpx.Response(200, json=[])
    )

    await gateway_client.get(
        "/api/v1/monitoring/metrics/query_range",
        params={"query": "up", "start": "1", "end": "2"},
        headers={"Authorization": "Bearer tok"},
    )
    assert route.called
    called_url = str(route.calls[0].request.url)
    assert "query=up" in called_url


@pytest.mark.asyncio
@respx.mock
async def test_proxy_upstream_error_returns_502(gateway_client, mock_redis):
    """If an upstream service is down, the gateway should propagate the error."""
    respx.get("http://monitoring-svc:8001/health").mock(side_effect=httpx.ConnectError("refused"))

    resp = await gateway_client.get(
        "/api/v1/monitoring/health",
        headers={"Authorization": "Bearer tok"},
    )
    assert resp.status_code >= 500
