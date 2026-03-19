from __future__ import annotations

from typing import Any, AsyncIterator

import structlog
from kubernetes import client, config
from kubernetes.client import ApiException

from shared.exceptions import UpstreamError

logger = structlog.get_logger(__name__)


class K8sClient:
    def __init__(self, *, in_cluster: bool = False, namespace: str = "default") -> None:
        self._namespace = namespace
        if in_cluster:
            config.load_incluster_config()
        else:
            try:
                config.load_kube_config()
            except config.ConfigException:
                logger.warning("k8s_config_not_found", msg="running without k8s access")
        self._core = client.CoreV1Api()

    def list_nodes(self) -> list[dict[str, Any]]:
        try:
            nodes = self._core.list_node()
            return [self._node_summary(n) for n in nodes.items]
        except ApiException as exc:
            raise UpstreamError("kubernetes", str(exc)) from exc

    def list_pods(self, namespace: str | None = None) -> list[dict[str, Any]]:
        ns = namespace or self._namespace
        try:
            pods = self._core.list_namespaced_pod(namespace=ns)
            return [self._pod_summary(p) for p in pods.items]
        except ApiException as exc:
            raise UpstreamError("kubernetes", str(exc)) from exc

    async def watch_events(self, namespace: str | None = None) -> AsyncIterator[dict[str, Any]]:
        """Yield K8s events as dicts. Used by SSE endpoint.

        The kubernetes-python Watch API is synchronous, so we run the
        blocking iterator in a thread via ``asyncio.to_thread`` and
        yield results back to the async caller.
        """
        import asyncio
        import queue
        from kubernetes import watch as k8s_watch

        ns = namespace or self._namespace
        event_queue: queue.Queue[dict[str, Any] | None] = queue.Queue()

        def _stream() -> None:
            w = k8s_watch.Watch()
            try:
                for event in w.stream(self._core.list_namespaced_event, namespace=ns, timeout_seconds=0):
                    event_queue.put({
                        "type": event["type"],
                        "object": {
                            "reason": event["object"].reason,
                            "message": event["object"].message,
                            "involved_object": event["object"].involved_object.name,
                        },
                    })
            except ApiException:
                pass
            finally:
                event_queue.put(None)
                w.stop()

        task = asyncio.get_event_loop().run_in_executor(None, _stream)
        try:
            while True:
                try:
                    item = event_queue.get_nowait()
                except queue.Empty:
                    await asyncio.sleep(0.1)
                    continue
                if item is None:
                    break
                yield item
        finally:
            task.cancel() if hasattr(task, "cancel") else None

    @staticmethod
    def _node_summary(node: Any) -> dict[str, Any]:
        status = "Unknown"
        for cond in node.status.conditions or []:
            if cond.type == "Ready":
                status = "Ready" if cond.status == "True" else "NotReady"
                break

        cap = node.status.capacity or {}
        alloc = node.status.allocatable or {}
        return {
            "name": node.metadata.name,
            "status": status,
            "roles": [
                label.split("/")[-1] or "master"
                for label in (node.metadata.labels or {})
                if label.startswith("node-role.kubernetes.io/")
            ],
            "cpu_capacity": cap.get("cpu", "0"),
            "memory_capacity": cap.get("memory", "0"),
            "cpu_allocatable": alloc.get("cpu", "0"),
            "memory_allocatable": alloc.get("memory", "0"),
        }

    @staticmethod
    def _pod_summary(pod: Any) -> dict[str, Any]:
        return {
            "name": pod.metadata.name,
            "namespace": pod.metadata.namespace,
            "status": pod.status.phase,
            "node": pod.spec.node_name,
            "containers": [c.name for c in pod.spec.containers],
            "restarts": sum(
                (cs.restart_count or 0) for cs in (pod.status.container_statuses or [])
            ),
        }
