from __future__ import annotations

from fastapi import APIRouter, Query

from pipeline_svc.clients.spark import SparkClient
from pipeline_svc.config import settings

router = APIRouter()


def _spark() -> SparkClient:
    return SparkClient(settings.spark_url)


@router.get("/jobs")
async def list_jobs(app_id: str | None = Query(None)) -> list[dict]:
    client = _spark()
    try:
        return await client.list_jobs(app_id)
    finally:
        await client.close()


@router.get("/jobs/{app_id}/{job_id}")
async def get_job(app_id: str, job_id: int) -> dict:
    client = _spark()
    try:
        return await client.get_job(app_id, job_id)
    finally:
        await client.close()


@router.get("/stages/{app_id}")
async def list_stages(app_id: str) -> list[dict]:
    client = _spark()
    try:
        return await client.list_stages(app_id)
    finally:
        await client.close()
