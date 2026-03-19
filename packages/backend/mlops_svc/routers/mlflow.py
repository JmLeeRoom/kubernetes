from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from mlops_svc.clients.mlflow_client import MLflowClient
from mlops_svc.config import settings
from shared.exceptions import UpstreamError

router = APIRouter()


def _mlflow() -> MLflowClient:
    return MLflowClient(settings.mlflow_url)


class CompareRequest(BaseModel):
    run_ids: list[str]


class StageTransitionRequest(BaseModel):
    stage: str


@router.get("/")
async def list_experiments() -> list[dict[str, Any]]:
    client = _mlflow()
    try:
        experiments = await client.list_experiments()
        return [e.model_dump() for e in experiments]
    except Exception as exc:
        raise UpstreamError("mlflow", str(exc)) from exc
    finally:
        await client.close()


@router.get("/{experiment_id}/runs")
async def list_runs(experiment_id: str, max_results: int = 100) -> list[dict[str, Any]]:
    client = _mlflow()
    try:
        runs = await client.list_runs([experiment_id], max_results=max_results)
        return [r.model_dump() for r in runs]
    except Exception as exc:
        raise UpstreamError("mlflow", str(exc)) from exc
    finally:
        await client.close()


@router.post("/runs/compare")
async def compare_runs(body: CompareRequest) -> list[dict[str, Any]]:
    if not body.run_ids:
        raise HTTPException(status_code=400, detail="run_ids must not be empty")
    client = _mlflow()
    try:
        runs = await client.compare_runs(body.run_ids)
        return [r.model_dump() for r in runs]
    except Exception as exc:
        raise UpstreamError("mlflow", str(exc)) from exc
    finally:
        await client.close()


@router.get("/models")
async def list_models() -> list[dict[str, Any]]:
    client = _mlflow()
    try:
        models = await client.list_registered_models()
        return [m.model_dump() for m in models]
    except Exception as exc:
        raise UpstreamError("mlflow", str(exc)) from exc
    finally:
        await client.close()


@router.get("/models/{name}/versions")
async def get_model_versions(name: str) -> list[dict[str, Any]]:
    client = _mlflow()
    try:
        versions = await client.get_model_versions(name)
        return [v.model_dump() for v in versions]
    except Exception as exc:
        raise UpstreamError("mlflow", str(exc)) from exc
    finally:
        await client.close()


@router.post("/models/{name}/versions/{version}/stage")
async def transition_stage(
    name: str, version: str, body: StageTransitionRequest
) -> dict[str, Any]:
    client = _mlflow()
    try:
        mv = await client.transition_model_stage(name, version, body.stage)
        return mv.model_dump()
    except Exception as exc:
        raise UpstreamError("mlflow", str(exc)) from exc
    finally:
        await client.close()
