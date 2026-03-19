"""JWT verification middleware for the API gateway."""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from shared.auth import get_current_user


_PUBLIC_PATHS = frozenset({"/health", "/docs", "/openapi.json", "/api/v1/auth/login", "/api/v1/auth/refresh"})


class AuthMiddleware(BaseHTTPMiddleware):
    """Attach ``request.state.user`` for every authenticated request.

    Public paths (health, login, refresh) bypass verification.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path in _PUBLIC_PATHS or request.method == "OPTIONS":
            return await call_next(request)

        request.state.user = get_current_user(request)
        return await call_next(request)
