from __future__ import annotations

from typing import Any

import httpx
import structlog

from shared.exceptions import UpstreamError

logger = structlog.get_logger(__name__)


class LokiClient:
    def __init__(self, base_url: str, timeout: float = 10.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(base_url=self._base_url, timeout=timeout)

    async def close(self) -> None:
        await self._client.aclose()

    async def query(
        self,
        logql: str,
        start: str | None = None,
        end: str | None = None,
        limit: int = 100,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"query": logql, "limit": limit}
        if start:
            params["start"] = start
        if end:
            params["end"] = end
        return await self._get("/loki/api/v1/query_range", params)

    async def labels(self) -> list[str]:
        data = await self._get("/loki/api/v1/labels", {})
        return data.get("data", [])

    async def _get(self, path: str, params: dict[str, Any]) -> dict[str, Any]:
        try:
            resp = await self._client.get(path, params=params)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error("loki_http_error", status=exc.response.status_code)
            raise UpstreamError("loki", str(exc)) from exc
        except httpx.RequestError as exc:
            logger.error("loki_request_error", error=str(exc))
            raise UpstreamError("loki", str(exc)) from exc
