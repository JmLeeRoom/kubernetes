from __future__ import annotations

import asyncio
from typing import Any

import httpx
import structlog
from pydantic import BaseModel

from shared.exceptions import UpstreamError

logger = structlog.get_logger(__name__)


class Experiment(BaseModel):
    experiment_id: str
    name: str
    artifact_location: str
    lifecycle_stage: str
    tags: dict[str, str] = {}


class Run(BaseModel):
    run_id: str
    experiment_id: str
    status: str
    start_time: int
    end_time: int | None = None
    metrics: dict[str, Any] = {}
    params: dict[str, str] = {}
    tags: dict[str, str] = {}


class RegisteredModel(BaseModel):
    name: str
    latest_versions: list[dict[str, Any]] = []
    description: str | None = None
    tags: dict[str, str] = {}


class ModelVersion(BaseModel):
    name: str
    version: str
    current_stage: str
    status: str
    source: str
    run_id: str | None = None


class MLflowClient:
    """MLflow REST API v2.0 wrapper."""

    def __init__(self, base_url: str) -> None:
        self._client = httpx.AsyncClient(base_url=base_url, timeout=30)

    async def list_experiments(self) -> list[Experiment]:
        try:
            resp = await self._client.get("/api/2.0/mlflow/experiments/list")
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError("mlflow", str(exc)) from exc
        return [Experiment(**e) for e in resp.json().get("experiments", [])]

    async def list_runs(
        self, experiment_ids: list[str], max_results: int = 100
    ) -> list[Run]:
        try:
            resp = await self._client.post(
                "/api/2.0/mlflow/runs/search",
                json={
                    "experiment_ids": experiment_ids,
                    "max_results": max_results,
                    "order_by": ["attribute.start_time DESC"],
                },
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError("mlflow", str(exc)) from exc
        runs_raw = resp.json().get("runs", [])
        result: list[Run] = []
        for r in runs_raw:
            info = r["info"]
            data = r.get("data", {})
            result.append(
                Run(
                    run_id=info["run_id"],
                    experiment_id=info["experiment_id"],
                    status=info["status"],
                    start_time=info["start_time"],
                    end_time=info.get("end_time"),
                    metrics={
                        m["key"]: m["value"] for m in data.get("metrics", [])
                    },
                    params={
                        p["key"]: p["value"] for p in data.get("params", [])
                    },
                    tags={
                        t["key"]: t["value"] for t in data.get("tags", [])
                    },
                )
            )
        return result

    async def get_run(self, run_id: str) -> Run:
        try:
            resp = await self._client.get(
                f"/api/2.0/mlflow/runs/get?run_id={run_id}"
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError("mlflow", str(exc)) from exc
        r = resp.json()["run"]
        info = r["info"]
        data = r.get("data", {})
        return Run(
            run_id=info["run_id"],
            experiment_id=info["experiment_id"],
            status=info["status"],
            start_time=info["start_time"],
            end_time=info.get("end_time"),
            metrics={m["key"]: m["value"] for m in data.get("metrics", [])},
            params={p["key"]: p["value"] for p in data.get("params", [])},
            tags={t["key"]: t["value"] for t in data.get("tags", [])},
        )

    async def compare_runs(self, run_ids: list[str]) -> list[Run]:
        tasks = [self.get_run(rid) for rid in run_ids]
        return list(await asyncio.gather(*tasks))

    async def list_registered_models(self) -> list[RegisteredModel]:
        try:
            resp = await self._client.get(
                "/api/2.0/mlflow/registered-models/list"
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError("mlflow", str(exc)) from exc
        return [
            RegisteredModel(**m)
            for m in resp.json().get("registered_models", [])
        ]

    async def get_model_versions(self, name: str) -> list[ModelVersion]:
        try:
            resp = await self._client.get(
                "/api/2.0/mlflow/registered-models/get",
                params={"name": name},
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError("mlflow", str(exc)) from exc
        rm = resp.json().get("registered_model", {})
        return [
            ModelVersion(**v)
            for v in rm.get("latest_versions", [])
        ]

    async def transition_model_stage(
        self, name: str, version: str, stage: str
    ) -> ModelVersion:
        try:
            resp = await self._client.post(
                "/api/2.0/mlflow/model-versions/transition-stage",
                json={
                    "name": name,
                    "version": version,
                    "stage": stage,
                    "archive_existing_versions": False,
                },
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError("mlflow", str(exc)) from exc
        return ModelVersion(**resp.json()["model_version"])

    async def close(self) -> None:
        await self._client.aclose()
