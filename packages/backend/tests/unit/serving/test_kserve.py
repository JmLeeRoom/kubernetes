from unittest.mock import MagicMock, patch

import pytest

from serving_svc.clients.kserve import InferenceServiceSpec


MOCK_ISVC = {
    "apiVersion": "serving.kserve.io/v1beta1",
    "kind": "InferenceService",
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
        }
    },
    "status": {
        "conditions": [{"type": "Ready", "status": "True"}],
        "url": "http://test-model.model-serving.svc.cluster.local",
    },
}


@patch("kubernetes.config.load_incluster_config", side_effect=Exception("not in cluster"))
@patch("kubernetes.config.load_kube_config")
@patch("kubernetes.client.CustomObjectsApi")
def test_list_returns_items(mock_custom_api_cls, mock_kube_config, mock_incluster):
    mock_api = MagicMock()
    mock_custom_api_cls.return_value = mock_api
    mock_api.list_namespaced_custom_object.return_value = {"items": [MOCK_ISVC]}

    from serving_svc.clients.kserve import KServeClient
    kserve = KServeClient()
    items = kserve.list("model-serving")

    assert len(items) == 1
    assert items[0]["metadata"]["name"] == "test-model"


@patch("kubernetes.config.load_incluster_config", side_effect=Exception("not in cluster"))
@patch("kubernetes.config.load_kube_config")
@patch("kubernetes.client.CustomObjectsApi")
def test_get_returns_single(mock_custom_api_cls, mock_kube_config, mock_incluster):
    mock_api = MagicMock()
    mock_custom_api_cls.return_value = mock_api
    mock_api.get_namespaced_custom_object.return_value = MOCK_ISVC

    from serving_svc.clients.kserve import KServeClient
    kserve = KServeClient()
    result = kserve.get("test-model", "model-serving")

    assert result["metadata"]["name"] == "test-model"


@patch("kubernetes.config.load_incluster_config", side_effect=Exception("not in cluster"))
@patch("kubernetes.config.load_kube_config")
@patch("kubernetes.client.CustomObjectsApi")
def test_create_calls_api(mock_custom_api_cls, mock_kube_config, mock_incluster):
    mock_api = MagicMock()
    mock_custom_api_cls.return_value = mock_api
    mock_api.create_namespaced_custom_object.return_value = MOCK_ISVC

    from serving_svc.clients.kserve import KServeClient
    kserve = KServeClient()
    spec = InferenceServiceSpec(
        name="test-model",
        framework="sklearn",
        model_uri="s3://bucket/model",
    )
    result = kserve.create(spec)

    assert result["metadata"]["name"] == "test-model"
    mock_api.create_namespaced_custom_object.assert_called_once()


@patch("kubernetes.config.load_incluster_config", side_effect=Exception("not in cluster"))
@patch("kubernetes.config.load_kube_config")
@patch("kubernetes.client.CustomObjectsApi")
def test_delete_calls_api(mock_custom_api_cls, mock_kube_config, mock_incluster):
    mock_api = MagicMock()
    mock_custom_api_cls.return_value = mock_api

    from serving_svc.clients.kserve import KServeClient
    kserve = KServeClient()
    kserve.delete("test-model", "model-serving")

    mock_api.delete_namespaced_custom_object.assert_called_once()


@patch("kubernetes.config.load_incluster_config", side_effect=Exception("not in cluster"))
@patch("kubernetes.config.load_kube_config")
@patch("kubernetes.client.CustomObjectsApi")
def test_update_traffic(mock_custom_api_cls, mock_kube_config, mock_incluster):
    mock_api = MagicMock()
    mock_custom_api_cls.return_value = mock_api
    mock_api.patch_namespaced_custom_object.return_value = MOCK_ISVC

    from serving_svc.clients.kserve import KServeClient
    kserve = KServeClient()
    kserve.update_traffic("test-model", 20, "model-serving")

    mock_api.patch_namespaced_custom_object.assert_called_once()
    call_kwargs = mock_api.patch_namespaced_custom_object.call_args
    assert call_kwargs.kwargs["body"]["spec"]["canaryTrafficPercent"] == 20
