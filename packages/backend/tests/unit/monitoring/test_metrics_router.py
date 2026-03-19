from unittest.mock import AsyncMock, patch

import pytest

QUERY_RANGE_RESULT = {
    "resultType": "matrix",
    "result": [
        {
            "metric": {"__name__": "cpu_usage"},
            "values": [[1000, "0.5"], [1015, "0.6"]],
        }
    ],
}


@pytest.mark.asyncio
async def test_query_range_endpoint(client, mock_redis):
    with patch(
        "monitoring_svc.routers.metrics._prom"
    ) as mock_prom_factory:
        mock_prom = AsyncMock()
        mock_prom.query_range = AsyncMock(return_value=QUERY_RANGE_RESULT)
        mock_prom.close = AsyncMock()
        mock_prom_factory.return_value = mock_prom

        resp = await client.get(
            "/metrics/query_range",
            params={"query": "cpu_usage", "start": "1000", "end": "2000"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["resultType"] == "matrix"
        assert len(body["result"]) == 1


@pytest.mark.asyncio
async def test_query_range_uses_cache(client, mock_redis):
    """When cache has data, Prometheus should not be called."""
    import json

    mock_redis.get = AsyncMock(return_value=json.dumps(QUERY_RANGE_RESULT))

    with patch(
        "monitoring_svc.routers.metrics._prom"
    ) as mock_prom_factory:
        mock_prom = AsyncMock()
        mock_prom_factory.return_value = mock_prom

        resp = await client.get(
            "/metrics/query_range",
            params={"query": "cpu_usage", "start": "1000", "end": "2000"},
        )
        assert resp.status_code == 200
        mock_prom.query_range.assert_not_called()
