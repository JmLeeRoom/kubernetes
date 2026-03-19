from __future__ import annotations

from fastapi import APIRouter, Query

from pipeline_svc.clients.prefect import PrefectClient
from pipeline_svc.config import settings

router = APIRouter()


def _prefect() -> PrefectClient:
    return PrefectClient(settings.prefect_url)


@router.get("/")
async def list_flows() -> list[dict]:
    client = _prefect()
    try:
        return await client.list_flows()
    finally:
        await client.close()


@router.get("/runs")
async def list_flow_runs(
    limit: int = Query(20, ge=1, le=200),
    flow_id: str | None = Query(None),
) -> list[dict]:
    client = _prefect()
    try:
        return await client.list_flow_runs(limit=limit, flow_id=flow_id)
    finally:
        await client.close()


@router.post("/runs/{run_id}/cancel")
async def cancel_flow_run(run_id: str) -> dict[str, str]:
    client = _prefect()
    try:
        await client.cancel_flow_run(run_id)
        return {"status": "cancelling", "run_id": run_id}
    finally:
        await client.close()
