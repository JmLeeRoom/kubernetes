"""Prometheus query client for serving-svc metrics."""

from __future__ import annotations

from typing import Any

import httpx
import structlog

from shared.exceptions import UpstreamError

logger = structlog.get_logger(__name__)


class PrometheusClient:
    """Lightweight async Prometheus query client."""

    def __init__(self, base_url: str, timeout: float = 10.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout

    async def query(self, promql: str) -> list[dict[str, Any]]:
        """Execute an instant query and return the result vector."""
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.get(
                    f"{self._base_url}/api/v1/query",
                    params={"query": promql},
                )
                resp.raise_for_status()
                data = resp.json()
                return data.get("data", {}).get("result", [])
        except httpx.HTTPStatusError as exc:
            logger.error("prometheus_http_error", status=exc.response.status_code)
            raise UpstreamError("prometheus", str(exc)) from exc
        except httpx.RequestError as exc:
            logger.error("prometheus_request_error", error=str(exc))
            raise UpstreamError("prometheus", str(exc)) from exc
