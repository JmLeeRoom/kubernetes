import pytest


@pytest.mark.asyncio
async def test_health_returns_200(mlops_client):
    resp = await mlops_client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["service"] == "mlops-svc"
    assert "version" in body
    assert "timestamp" in body
