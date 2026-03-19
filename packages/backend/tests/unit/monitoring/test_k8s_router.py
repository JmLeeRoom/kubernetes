"""Tests for the K8s router."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_nodes(client: AsyncClient, mock_redis):
    """GET /k8s/nodes returns node list from K8s API."""
    mock_node = MagicMock()
    mock_node.metadata.name = "node-01"
    mock_node.metadata.labels = {"node-role.kubernetes.io/worker": ""}
    mock_node.status.conditions = [
        MagicMock(type="Ready", status="True")
    ]
    mock_node.status.capacity = {"cpu": "4", "memory": "16Gi"}
    mock_node.status.allocatable = {"cpu": "3.8", "memory": "15Gi"}

    with (
        patch(
            "monitoring_svc.clients.k8s_client.client.CoreV1Api"
        ) as mock_api,
        patch("monitoring_svc.clients.k8s_client.config"),
    ):
        mock_api.return_value.list_node.return_value.items = [mock_node]
        resp = await client.get("/k8s/nodes")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "node-01"


@pytest.mark.asyncio
async def test_list_pods(client: AsyncClient, mock_redis):
    """GET /k8s/pods returns pod list from K8s API."""
    mock_pod = MagicMock()
    mock_pod.metadata.name = "pod-01"
    mock_pod.metadata.namespace = "default"
    mock_pod.status.phase = "Running"
    mock_pod.spec.node_name = "node-01"
    mock_pod.spec.containers = [MagicMock(name="app")]
    mock_pod.status.container_statuses = [MagicMock(restart_count=0)]

    with (
        patch(
            "monitoring_svc.clients.k8s_client.client.CoreV1Api"
        ) as mock_api,
        patch("monitoring_svc.clients.k8s_client.config"),
    ):
        mock_api.return_value.list_namespaced_pod.return_value.items = [
            mock_pod
        ]
        resp = await client.get("/k8s/pods")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "pod-01"
