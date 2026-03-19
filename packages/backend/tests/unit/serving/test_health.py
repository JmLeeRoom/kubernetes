import pytest


@pytest.mark.asyncio
async def test_health_returns_ok(serving_client):
    resp = await serving_client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "serving-svc"
    assert "version" in body
    assert "timestamp" in body
