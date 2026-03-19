from unittest.mock import MagicMock, patch

import pytest

from monitoring_svc.clients.k8s_client import K8sClient


def _make_node(name: str, ready: bool = True):
    node = MagicMock()
    node.metadata.name = name
    node.metadata.labels = {"node-role.kubernetes.io/control-plane": ""}
    cond = MagicMock()
    cond.type = "Ready"
    cond.status = "True" if ready else "False"
    node.status.conditions = [cond]
    node.status.capacity = {"cpu": "4", "memory": "16Gi"}
    node.status.allocatable = {"cpu": "3800m", "memory": "15Gi"}
    return node


def _make_pod(name: str, namespace: str = "default", phase: str = "Running"):
    pod = MagicMock()
    pod.metadata.name = name
    pod.metadata.namespace = namespace
    pod.status.phase = phase
    pod.spec.node_name = "node-1"
    container = MagicMock()
    container.name = "main"
    pod.spec.containers = [container]
    cs = MagicMock()
    cs.restart_count = 0
    pod.status.container_statuses = [cs]
    return pod


@patch("monitoring_svc.clients.k8s_client.config")
@patch("monitoring_svc.clients.k8s_client.client.CoreV1Api")
def test_list_nodes(mock_core_cls, mock_config):
    mock_core = MagicMock()
    mock_core_cls.return_value = mock_core

    nodes_resp = MagicMock()
    nodes_resp.items = [_make_node("node-1"), _make_node("node-2", ready=False)]
    mock_core.list_node.return_value = nodes_resp

    k = K8sClient()
    result = k.list_nodes()
    assert len(result) == 2
    assert result[0]["name"] == "node-1"
    assert result[0]["status"] == "Ready"
    assert result[1]["status"] == "NotReady"


@patch("monitoring_svc.clients.k8s_client.config")
@patch("monitoring_svc.clients.k8s_client.client.CoreV1Api")
def test_list_pods(mock_core_cls, mock_config):
    mock_core = MagicMock()
    mock_core_cls.return_value = mock_core

    pods_resp = MagicMock()
    pods_resp.items = [_make_pod("pod-a"), _make_pod("pod-b", phase="Pending")]
    mock_core.list_namespaced_pod.return_value = pods_resp

    k = K8sClient()
    result = k.list_pods()
    assert len(result) == 2
    assert result[0]["name"] == "pod-a"
    assert result[0]["status"] == "Running"
    assert result[1]["status"] == "Pending"
