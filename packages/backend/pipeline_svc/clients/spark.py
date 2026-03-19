from __future__ import annotations

from typing import Any

import httpx
import structlog

from shared.exceptions import UpstreamError

logger = structlog.get_logger(__name__)


class SparkClient:
    def __init__(self, base_url: str, timeout: float = 10.0) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            timeout=timeout,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def list_jobs(self, app_id: str | None = None) -> list[dict[str, Any]]:
        """List Spark jobs. If app_id provided, list jobs for that application."""
        path = f"/api/v1/applications/{app_id}/jobs" if app_id else "/api/v1/applications"
        return await self._get(path)

    async def get_job(self, app_id: str, job_id: int) -> dict[str, Any]:
        resp = await self._get_raw(f"/api/v1/applications/{app_id}/jobs/{job_id}")
        return resp

    async def list_stages(self, app_id: str) -> list[dict[str, Any]]:
        return await self._get(f"/api/v1/applications/{app_id}/stages")

    async def _get(self, path: str) -> list[dict[str, Any]]:
        try:
            resp = await self._client.get(path)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error("spark_http_error", status=exc.response.status_code, path=path)
            raise UpstreamError("spark", str(exc)) from exc
        except httpx.RequestError as exc:
            logger.error("spark_request_error", error=str(exc))
            raise UpstreamError("spark", str(exc)) from exc

    async def _get_raw(self, path: str) -> dict[str, Any]:
        try:
            resp = await self._client.get(path)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error("spark_http_error", status=exc.response.status_code, path=path)
            raise UpstreamError("spark", str(exc)) from exc
        except httpx.RequestError as exc:
            logger.error("spark_request_error", error=str(exc))
            raise UpstreamError("spark", str(exc)) from exc
