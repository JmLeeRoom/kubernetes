from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx
import structlog
from pydantic import BaseModel

from shared.exceptions import UpstreamError

logger = structlog.get_logger(__name__)


class DAG(BaseModel):
    dag_id: str
    description: str | None = None
    is_paused: bool
    is_active: bool
    schedule_interval: str | None = None
    next_dagrun: datetime | None = None


class DAGRun(BaseModel):
    dag_run_id: str
    dag_id: str
    state: str
    execution_date: datetime | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class TaskInstance(BaseModel):
    task_id: str
    dag_id: str
    state: str | None = None
    execution_date: datetime | None = None


class AirflowClient:
    """Airflow REST API v1 wrapper."""

    def __init__(
        self, base_url: str, username: str, password: str
    ) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            auth=(username, password),
            timeout=30,
        )

    async def list_dags(self) -> list[DAG]:
        try:
            resp = await self._client.get("/api/v1/dags", params={"limit": 100})
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError("airflow", str(exc)) from exc
        return [DAG(**d) for d in resp.json().get("dags", [])]

    async def trigger_dag(
        self, dag_id: str, conf: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        try:
            resp = await self._client.post(
                f"/api/v1/dags/{dag_id}/dagRuns",
                json={"conf": conf or {}},
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError("airflow", str(exc)) from exc
        return resp.json()

    async def get_dag_tasks(self, dag_id: str) -> list[dict[str, Any]]:
        try:
            resp = await self._client.get(f"/api/v1/dags/{dag_id}/tasks")
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError("airflow", str(exc)) from exc
        tasks = resp.json().get("tasks", [])
        return [
            {
                "task_id": t["task_id"],
                "downstream_task_ids": t.get("downstream_task_ids", []),
                "task_type": t.get("task_type"),
            }
            for t in tasks
        ]

    async def set_dag_paused(
        self, dag_id: str, is_paused: bool
    ) -> dict[str, Any]:
        try:
            resp = await self._client.patch(
                f"/api/v1/dags/{dag_id}",
                json={"is_paused": is_paused},
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError("airflow", str(exc)) from exc
        return resp.json()

    async def list_dag_runs(self, dag_id: str) -> list[DAGRun]:
        try:
            resp = await self._client.get(
                f"/api/v1/dags/{dag_id}/dagRuns",
                params={"limit": 25, "order_by": "-execution_date"},
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError("airflow", str(exc)) from exc
        return [DAGRun(**r) for r in resp.json().get("dag_runs", [])]

    async def close(self) -> None:
        await self._client.aclose()
