from __future__ import annotations

from typing import Any

import httpx
import structlog

from shared.exceptions import UpstreamError

logger = structlog.get_logger(__name__)


class PrometheusClient:
    def __init__(self, base_url: str, timeout: float = 10.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(base_url=self._base_url, timeout=timeout)

    async def close(self) -> None:
        await self._client.aclose()

    async def query(self, promql: str, time: str | None = None) -> dict[str, Any]:
        params: dict[str, str] = {"query": promql}
        if time:
            params["time"] = time
        return await self._get("/api/v1/query", params)

    async def query_range(
        self,
        promql: str,
        start: str,
        end: str,
        step: str = "15s",
    ) -> dict[str, Any]:
        params = {"query": promql, "start": start, "end": end, "step": step}
        return await self._get("/api/v1/query_range", params)

    async def _get(self, path: str, params: dict[str, str]) -> dict[str, Any]:
        try:
            resp = await self._client.get(path, params=params)
            resp.raise_for_status()
            data = resp.json()
            if data.get("status") != "success":
                raise UpstreamError("prometheus", data.get("error", "unknown error"))
            return data["data"]
        except httpx.HTTPStatusError as exc:
            logger.error("prometheus_http_error", status=exc.response.status_code)
            raise UpstreamError("prometheus", str(exc)) from exc
        except httpx.RequestError as exc:
            logger.error("prometheus_request_error", error=str(exc))
            raise UpstreamError("prometheus", str(exc)) from exc
