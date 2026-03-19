"""Simple Redis-based sliding-window rate limiter."""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from shared.cache import get_redis
from shared.logging import get_logger

logger = get_logger("api_gateway.rate_limit")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Limit requests per client IP using a Redis counter with TTL."""

    def __init__(self, app: object, max_requests: int = 100, window_seconds: int = 60) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self.max_requests = max_requests
        self.window = window_seconds

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        key = f"rl:{client_ip}"

        try:
            redis = get_redis()
            async with redis.pipeline() as pipe:
                pipe.incr(key)
                pipe.expire(key, self.window)
                results = await pipe.execute()
            count = results[0]
            if count > self.max_requests:
                logger.warning("rate_limit_exceeded", client=client_ip, count=count)
                return JSONResponse(
                    {"detail": "Rate limit exceeded"},
                    status_code=429,
                    headers={"Retry-After": str(self.window)},
                )
        except RuntimeError:
            pass  # Redis not initialised – allow request through

        return await call_next(request)
