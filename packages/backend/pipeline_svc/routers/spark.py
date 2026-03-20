from __future__ import annotations

import structlog
from fastapi import APIRouter, Query

from pipeline_svc.clients.spark import SparkClient
from pipeline_svc.config import settings
from shared.exceptions import UpstreamError

logger = structlog.get_logger(__name__)

router = APIRouter()


def _spark() -> SparkClient:
    return SparkClient(settings.spark_url)


@router.get("/jobs")
async def list_jobs(app_id: str | None = Query(None)) -> list[dict]:
    client = _spark()
    try:
        return await client.list_jobs(app_id)
    except UpstreamError:
        logger.warning("spark_unavailable", msg="Spark not reachable, returning empty list")
        return []
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
    except UpstreamError:
        logger.warning("spark_stages_unavailable", msg="Spark not reachable, returning empty list")
        return []
    finally:
        await client.close()
