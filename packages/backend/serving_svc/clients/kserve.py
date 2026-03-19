from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel
import structlog

logger = structlog.get_logger(__name__)

KSERVE_GROUP = "serving.kserve.io"
KSERVE_VERSION = "v1beta1"
KSERVE_PLURAL = "inferenceservices"

Framework = Literal["sklearn", "pytorch", "tensorflow", "onnx", "xgboost", "triton"]


class InferenceServiceSpec(BaseModel):
    model_config = {"protected_namespaces": ()}

    name: str
    namespace: str = "model-serving"
    framework: Framework
    model_uri: str
    min_replicas: int = 1
    max_replicas: int = 3
    cpu_request: str = "100m"
    cpu_limit: str = "1"
    memory_request: str = "512Mi"
    memory_limit: str = "2Gi"
    canary_percent: int | None = None


class KServeClient:
    def __init__(self) -> None:
        from kubernetes import client, config

        try:
            config.load_incluster_config()
        except Exception:
            config.load_kube_config()
        self.api = client.CustomObjectsApi()

    def _build_body(self, spec: InferenceServiceSpec) -> dict[str, Any]:
        predictor_config = {
            spec.framework: {
                "storageUri": spec.model_uri,
                "resources": {
                    "requests": {"cpu": spec.cpu_request, "memory": spec.memory_request},
                    "limits": {"cpu": spec.cpu_limit, "memory": spec.memory_limit},
                },
            }
        }
        body: dict[str, Any] = {
            "apiVersion": f"{KSERVE_GROUP}/{KSERVE_VERSION}",
            "kind": "InferenceService",
            "metadata": {
                "name": spec.name,
                "namespace": spec.namespace,
                "labels": {"app.kubernetes.io/managed-by": "mlops-platform"},
            },
            "spec": {
                "predictor": {
                    **predictor_config,
                    "minReplicas": spec.min_replicas,
                    "maxReplicas": spec.max_replicas,
                }
            },
        }
        if spec.canary_percent is not None:
            body["spec"]["canaryTrafficPercent"] = spec.canary_percent
        return body

    def create(self, spec: InferenceServiceSpec) -> dict[str, Any]:
        logger.info("kserve_create", name=spec.name, framework=spec.framework)
        return self.api.create_namespaced_custom_object(
            group=KSERVE_GROUP,
            version=KSERVE_VERSION,
            namespace=spec.namespace,
            plural=KSERVE_PLURAL,
            body=self._build_body(spec),
        )

    def list(self, namespace: str = "model-serving") -> list[dict[str, Any]]:
        result = self.api.list_namespaced_custom_object(
            group=KSERVE_GROUP,
            version=KSERVE_VERSION,
            namespace=namespace,
            plural=KSERVE_PLURAL,
        )
        return result.get("items", [])

    def get(self, name: str, namespace: str = "model-serving") -> dict[str, Any]:
        return self.api.get_namespaced_custom_object(
            group=KSERVE_GROUP,
            version=KSERVE_VERSION,
            namespace=namespace,
            plural=KSERVE_PLURAL,
            name=name,
        )

    def delete(self, name: str, namespace: str = "model-serving") -> None:
        logger.info("kserve_delete", name=name)
        self.api.delete_namespaced_custom_object(
            group=KSERVE_GROUP,
            version=KSERVE_VERSION,
            namespace=namespace,
            plural=KSERVE_PLURAL,
            name=name,
        )

    def update_traffic(
        self, name: str, canary_percent: int, namespace: str = "model-serving"
    ) -> dict[str, Any]:
        logger.info("kserve_update_traffic", name=name, canary=canary_percent)
        patch = {"spec": {"canaryTrafficPercent": canary_percent}}
        return self.api.patch_namespaced_custom_object(
            group=KSERVE_GROUP,
            version=KSERVE_VERSION,
            namespace=namespace,
            plural=KSERVE_PLURAL,
            name=name,
            body=patch,
        )
