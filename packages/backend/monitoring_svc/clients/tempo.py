from __future__ import annotations

from typing import Any

import httpx
import structlog

from shared.exceptions import UpstreamError

logger = structlog.get_logger(__name__)


class TempoClient:
    def __init__(self, base_url: str, timeout: float = 10.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(base_url=self._base_url, timeout=timeout)

    async def close(self) -> None:
        await self._client.aclose()

    async def get_trace(self, trace_id: str) -> dict[str, Any]:
        try:
            resp = await self._client.get(f"/api/traces/{trace_id}")
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error("tempo_http_error", status=exc.response.status_code)
            raise UpstreamError("tempo", str(exc)) from exc
        except httpx.RequestError as exc:
            logger.error("tempo_request_error", error=str(exc))
            raise UpstreamError("tempo", str(exc)) from exc

    async def search_traces(
        self,
        service_name: str | None = None,
        operation: str | None = None,
        min_duration: str | None = None,
        max_duration: str | None = None,
        limit: int = 20,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"limit": limit}
        tags_parts: list[str] = []
        if service_name:
            tags_parts.append(f'service.name="{service_name}"')
        if operation:
            tags_parts.append(f'name="{operation}"')
        if tags_parts:
            params["tags"] = " ".join(tags_parts)
        if min_duration:
            params["minDuration"] = min_duration
        if max_duration:
            params["maxDuration"] = max_duration

        try:
            resp = await self._client.get("/api/search", params=params)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error("tempo_http_error", status=exc.response.status_code)
            raise UpstreamError("tempo", str(exc)) from exc
        except httpx.RequestError as exc:
            logger.error("tempo_request_error", error=str(exc))
            raise UpstreamError("tempo", str(exc)) from exc
