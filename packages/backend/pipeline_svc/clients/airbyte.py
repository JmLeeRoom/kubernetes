from __future__ import annotations

from typing import Any

import httpx
import structlog

from shared.exceptions import UpstreamError

logger = structlog.get_logger(__name__)


class AirbyteClient:
    def __init__(
        self,
        base_url: str,
        username: str = "airbyte",
        password: str = "password",
        timeout: float = 30.0,
    ) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            auth=(username, password),
            timeout=timeout,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def list_connections(self, workspace_id: str) -> list[dict[str, Any]]:
        return await self._post(
            "/v1/connections/list",
            json={"workspaceId": workspace_id},
            key="connections",
        )

    async def get_connection(self, connection_id: str) -> dict[str, Any]:
        return await self._post_raw(
            "/v1/connections/get",
            json={"connectionId": connection_id},
        )

    async def trigger_sync(self, connection_id: str) -> dict[str, Any]:
        return await self._post_raw(
            "/v1/connections/sync",
            json={"connectionId": connection_id},
        )

    async def get_jobs(self, connection_id: str, limit: int = 10) -> list[dict[str, Any]]:
        return await self._post(
            "/v1/jobs/list",
            json={
                "configId": connection_id,
                "configTypes": ["sync"],
                "pagination": {"pageSize": limit},
            },
            key="jobs",
        )

    async def _post(
        self, path: str, json: dict[str, Any], key: str
    ) -> list[dict[str, Any]]:
        data = await self._post_raw(path, json)
        return data.get(key, [])

    async def _post_raw(self, path: str, json: dict[str, Any]) -> dict[str, Any]:
        try:
            resp = await self._client.post(path, json=json)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error("airbyte_http_error", status=exc.response.status_code, path=path)
            raise UpstreamError("airbyte", str(exc)) from exc
        except httpx.RequestError as exc:
            logger.error("airbyte_request_error", error=str(exc))
            raise UpstreamError("airbyte", str(exc)) from exc
