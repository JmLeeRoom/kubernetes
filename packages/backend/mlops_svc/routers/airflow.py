from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from mlops_svc.clients.airflow_client import AirflowClient
from mlops_svc.config import settings
from shared.exceptions import UpstreamError

router = APIRouter()


def _airflow() -> AirflowClient:
    return AirflowClient(
        settings.airflow_url,
        settings.airflow_username,
        settings.airflow_password,
    )


class TriggerRequest(BaseModel):
    conf: dict[str, Any] = {}


class PauseRequest(BaseModel):
    is_paused: bool


@router.get("/")
async def list_dags() -> list[dict[str, Any]]:
    client = _airflow()
    try:
        dags = await client.list_dags()
        return [d.model_dump(mode="json") for d in dags]
    except Exception as exc:
        raise UpstreamError("airflow", str(exc)) from exc
    finally:
        await client.close()


@router.post("/{dag_id}/trigger")
async def trigger_dag(dag_id: str, body: TriggerRequest) -> dict[str, Any]:
    client = _airflow()
    try:
        return await client.trigger_dag(dag_id, conf=body.conf)
    except Exception as exc:
        raise UpstreamError("airflow", str(exc)) from exc
    finally:
        await client.close()


@router.get("/{dag_id}/graph")
async def get_dag_graph(dag_id: str) -> dict[str, Any]:
    client = _airflow()
    try:
        tasks = await client.get_dag_tasks(dag_id)
        return {"dag_id": dag_id, "tasks": tasks}
    except Exception as exc:
        raise UpstreamError("airflow", str(exc)) from exc
    finally:
        await client.close()


@router.patch("/{dag_id}/pause")
async def toggle_pause(dag_id: str, body: PauseRequest) -> dict[str, Any]:
    client = _airflow()
    try:
        return await client.set_dag_paused(dag_id, body.is_paused)
    except Exception as exc:
        raise UpstreamError("airflow", str(exc)) from exc
    finally:
        await client.close()


@router.get("/{dag_id}/runs")
async def list_dag_runs(dag_id: str) -> list[dict[str, Any]]:
    client = _airflow()
    try:
        runs = await client.list_dag_runs(dag_id)
        return [r.model_dump(mode="json") for r in runs]
    except Exception as exc:
        raise UpstreamError("airflow", str(exc)) from exc
    finally:
        await client.close()
