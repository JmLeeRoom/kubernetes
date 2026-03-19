from unittest.mock import AsyncMock, MagicMock, patch

import pytest


MOCK_ISVC_RAW = {
    "metadata": {
        "name": "test-model",
        "namespace": "model-serving",
        "creationTimestamp": "2026-03-01T00:00:00Z",
    },
    "spec": {
        "predictor": {
            "sklearn": {"storageUri": "s3://bucket/model"},
            "minReplicas": 1,
            "maxReplicas": 3,
        },
        "canaryTrafficPercent": 10,
    },
    "status": {
        "conditions": [{"type": "Ready", "status": "True"}],
        "url": "http://test-model.model-serving.svc.cluster.local",
    },
}


@pytest.mark.asyncio
async def test_list_services(serving_client, mock_redis):
    with patch("serving_svc.routers.inference._kserve") as mock_factory:
        mock_client = MagicMock()
        mock_client.list.return_value = [MOCK_ISVC_RAW]
        mock_factory.return_value = mock_client

        resp = await serving_client.get("/inference-services/")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body) == 1
        assert body[0]["name"] == "test-model"
        assert body[0]["framework"] == "sklearn"
        assert body[0]["ready"] is True
        assert body[0]["traffic"]["canary"] == 10
        assert body[0]["traffic"]["default"] == 90


@pytest.mark.asyncio
async def test_create_service(serving_client, mock_redis):
    with patch("serving_svc.routers.inference._kserve") as mock_factory:
        mock_client = MagicMock()
        mock_client.create.return_value = MOCK_ISVC_RAW
        mock_factory.return_value = mock_client

        resp = await serving_client.post(
            "/inference-services/",
            json={
                "name": "test-model",
                "framework": "sklearn",
                "model_uri": "s3://bucket/model",
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "test-model"
        assert body["message"] == "InferenceService created"


@pytest.mark.asyncio
async def test_get_service(serving_client, mock_redis):
    with patch("serving_svc.routers.inference._kserve") as mock_factory:
        mock_client = MagicMock()
        mock_client.get.return_value = MOCK_ISVC_RAW
        mock_factory.return_value = mock_client

        resp = await serving_client.get("/inference-services/test-model")
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == "test-model"


@pytest.mark.asyncio
async def test_delete_service(serving_client, mock_redis):
    with patch("serving_svc.routers.inference._kserve") as mock_factory:
        mock_client = MagicMock()
        mock_factory.return_value = mock_client

        resp = await serving_client.delete("/inference-services/test-model")
        assert resp.status_code == 204


@pytest.mark.asyncio
async def test_update_traffic(serving_client, mock_redis):
    with patch("serving_svc.routers.inference._kserve") as mock_factory:
        mock_client = MagicMock()
        mock_client.update_traffic.return_value = MOCK_ISVC_RAW
        mock_factory.return_value = mock_client

        resp = await serving_client.patch(
            "/inference-services/test-model/traffic",
            json={"canary_percent": 25},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["canary_percent"] == 25
