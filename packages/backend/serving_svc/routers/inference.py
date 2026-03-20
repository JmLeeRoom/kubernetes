from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

from serving_svc.clients.kserve import InferenceServiceSpec, KServeClient
from serving_svc.clients.prometheus import PrometheusClient
from serving_svc.config import settings
from shared.exceptions import NotFoundError, UpstreamError

router = APIRouter()


def _kserve() -> KServeClient:
    return KServeClient()


class CreateRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    name: str
    framework: str
    model_uri: str
    min_replicas: int = 1
    max_replicas: int = 3
    cpu_request: str = "100m"
    cpu_limit: str = "1"
    memory_request: str = "512Mi"
    memory_limit: str = "2Gi"
    canary_percent: int | None = None


class TrafficUpdate(BaseModel):
    canary_percent: int


def _extract_isvc(raw: dict[str, Any]) -> dict[str, Any]:
    """Extract a flat representation from a KServe CRD object."""
    meta = raw.get("metadata", {})
    spec = raw.get("spec", {})
    status = raw.get("status", {})
    predictor = spec.get("predictor", {})

    framework = "unknown"
    for fw in ("sklearn", "pytorch", "tensorflow", "onnx", "xgboost", "triton"):
        if fw in predictor:
            framework = fw
            break

    conditions = status.get("conditions", [])
    ready = any(
        c.get("type") == "Ready" and c.get("status") == "True" for c in conditions
    )

    url = status.get("url", "")
    traffic = spec.get("canaryTrafficPercent", 0)

    return {
        "name": meta.get("name", ""),
        "namespace": meta.get("namespace", settings.kserve_namespace),
        "framework": framework,
        "ready": ready,
        "url": url,
        "traffic": {"default": 100 - traffic, "canary": traffic},
        "created": meta.get("creationTimestamp", ""),
    }


@router.get("/")
async def list_services() -> list[dict[str, Any]]:
    client = _kserve()
    if not client.available:
        return []
    try:
        items = client.list(settings.kserve_namespace)
        return [_extract_isvc(item) for item in items]
    except Exception as exc:
        raise UpstreamError("kserve", str(exc)) from exc


@router.post("/", status_code=201)
async def create_service(req: CreateRequest) -> dict[str, Any]:
    spec = InferenceServiceSpec(
        name=req.name,
        namespace=settings.kserve_namespace,
        framework=req.framework,  # type: ignore[arg-type]
        model_uri=req.model_uri,
        min_replicas=req.min_replicas,
        max_replicas=req.max_replicas,
        cpu_request=req.cpu_request,
        cpu_limit=req.cpu_limit,
        memory_request=req.memory_request,
        memory_limit=req.memory_limit,
        canary_percent=req.canary_percent,
    )
    client = _kserve()
    try:
        result = client.create(spec)
        return {"message": "InferenceService created", "name": spec.name, "spec": result}
    except Exception as exc:
        raise UpstreamError("kserve", str(exc)) from exc


@router.get("/{name}")
async def get_service(name: str) -> dict[str, Any]:
    client = _kserve()
    try:
        raw = client.get(name, settings.kserve_namespace)
        return _extract_isvc(raw)
    except Exception as exc:
        if "404" in str(exc) or "NotFound" in str(exc):
            raise NotFoundError(f"InferenceService '{name}' not found") from exc
        raise UpstreamError("kserve", str(exc)) from exc


@router.delete("/{name}")
async def delete_service(name: str) -> Response:
    client = _kserve()
    try:
        client.delete(name, settings.kserve_namespace)
        return Response(status_code=204)
    except Exception as exc:
        if "404" in str(exc) or "NotFound" in str(exc):
            raise NotFoundError(f"InferenceService '{name}' not found") from exc
        raise UpstreamError("kserve", str(exc)) from exc


@router.patch("/{name}/traffic")
async def update_traffic(name: str, body: TrafficUpdate) -> dict[str, Any]:
    client = _kserve()
    try:
        result = client.update_traffic(name, body.canary_percent, settings.kserve_namespace)
        return {"name": name, "canary_percent": body.canary_percent, "status": "updated"}
    except Exception as exc:
        raise UpstreamError("kserve", str(exc)) from exc


@router.get("/{name}/metrics")
async def get_metrics(name: str) -> dict[str, Any]:
    """Fetch RPS and latency P99 from Prometheus for a given model."""
    prom = PrometheusClient(settings.prometheus_url)
    queries = {
        "rps": f'sum(rate(revision_request_count{{service_name="{name}"}}[5m]))',
        "latency_p99_ms": (
            f'histogram_quantile(0.99, sum(rate(revision_request_latencies_bucket'
            f'{{service_name="{name}"}}[5m])) by (le)) * 1000'
        ),
    }
    metrics: dict[str, float] = {}
    for key, query in queries.items():
        try:
            result = await prom.query(query)
            metrics[key] = float(result[0]["value"][1]) if result else 0.0
        except Exception:
            metrics[key] = 0.0
    return {"name": name, "metrics": metrics}
