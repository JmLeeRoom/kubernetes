"""Data lineage endpoints – traces artefact provenance through MLflow."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query

from mlops_svc.clients.mlflow_client import MLflowClient
from mlops_svc.config import settings

router = APIRouter()


def _mlflow() -> MLflowClient:
    return MLflowClient(settings.mlflow_url)


@router.get("/")
async def list_lineage(
    artifact: str = Query(default="", description="Artifact name or path to trace"),
) -> list[dict[str, Any]]:
    """Return lineage nodes for an artifact.

    Each node represents either a data source, a transformation (run),
    or an output artefact.  Edges capture the producer/consumer relationship.
    """
    if not artifact:
        return []

    client = _mlflow()
    try:
        experiments = await client.list_experiments()
        if not experiments:
            return []

        exp_ids = [e.experiment_id for e in experiments[:5]]
        runs = await client.list_runs(exp_ids, max_results=50)

        nodes: list[dict[str, Any]] = []
        for run in runs:
            for key, value in run.params.items():
                if artifact.lower() in key.lower() or artifact.lower() in str(value).lower():
                    nodes.append({
                        "id": run.run_id,
                        "type": "run",
                        "name": f"Run {run.run_id[:8]}",
                        "experiment_id": run.experiment_id,
                        "status": run.status,
                        "params": run.params,
                        "metrics": run.metrics,
                        "upstream": [],
                        "downstream": [],
                    })
                    break

        return nodes
    finally:
        await client.close()
