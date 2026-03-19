from __future__ import annotations

from typing import Any

import httpx
import structlog

from shared.exceptions import UpstreamError

logger = structlog.get_logger(__name__)


class PrefectClient:
    def __init__(self, base_url: str, timeout: float = 30.0) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            timeout=timeout,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def list_flows(self) -> list[dict[str, Any]]:
        return await self._post("/api/flows/filter", json={})

    async def list_flow_runs(
        self, limit: int = 20, flow_id: str | None = None
    ) -> list[dict[str, Any]]:
        body: dict[str, Any] = {"limit": limit, "sort": "START_TIME_DESC"}
        if flow_id:
            body["flows"] = {"operator": "and_", "id": {"any_": [flow_id]}}
        return await self._post("/api/flow_runs/filter", json=body)

    async def cancel_flow_run(self, run_id: str) -> None:
        try:
            resp = await self._client.post(
                f"/api/flow_runs/{run_id}/set_state",
                json={"state": {"type": "CANCELLING"}},
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            logger.error("prefect_http_error", status=exc.response.status_code)
            raise UpstreamError("prefect", str(exc)) from exc
        except httpx.RequestError as exc:
            logger.error("prefect_request_error", error=str(exc))
            raise UpstreamError("prefect", str(exc)) from exc

    async def _post(self, path: str, json: dict[str, Any]) -> list[dict[str, Any]]:
        try:
            resp = await self._client.post(path, json=json)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error("prefect_http_error", status=exc.response.status_code, path=path)
            raise UpstreamError("prefect", str(exc)) from exc
        except httpx.RequestError as exc:
            logger.error("prefect_request_error", error=str(exc))
            raise UpstreamError("prefect", str(exc)) from exc
