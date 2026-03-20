"""Authentication endpoints: login, refresh, and user info."""

from __future__ import annotations

import base64
import json
import logging
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from api_gateway.config import settings
from shared.auth import get_current_user, require_auth

router = APIRouter()
logger = logging.getLogger(__name__)

_TOKEN_URL = (
    f"{settings.auth_keycloak_url}/realms/{settings.auth_realm}"
    "/protocol/openid-connect/token"
)


class LoginRequest(BaseModel):
    """Accepts either ``email`` or ``username`` as the login identifier."""

    password: str
    username: str | None = None
    email: str | None = None

    @property
    def login_id(self) -> str:
        """Return whichever identifier was provided (email takes precedence)."""
        value = self.email or self.username
        if not value:
            raise ValueError("Either 'email' or 'username' must be provided")
        return value


class LoginUserInfo(BaseModel):
    """User info embedded in the login response."""

    id: str
    email: str
    name: str
    groups: list[str]


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900


class LoginResponse(TokenResponse):
    """Login response that includes user information."""

    user: LoginUserInfo


class RefreshRequest(BaseModel):
    refresh_token: str


class UserInfo(BaseModel):
    sub: str
    email: str
    groups: list[str]
    preferred_username: str


def _decode_jwt_payload(token: str) -> dict:
    """Decode a JWT payload without verification (used right after issuance).

    Returns an empty dict if the token is not a valid JWT structure.
    """
    parts = token.split(".")
    if len(parts) < 2:
        return {}
    try:
        payload_segment = parts[1]
        padded = payload_segment + "=" * (-len(payload_segment) % 4)
        return json.loads(base64.urlsafe_b64decode(padded))
    except Exception:
        return {}


def _dev_login(body: LoginRequest) -> LoginResponse:
    """Generate a dev-mode login response without contacting Keycloak."""
    login_id = body.login_id
    dev_token = f"dev-token-{uuid.uuid4().hex}"
    dev_refresh = f"dev-refresh-{uuid.uuid4().hex}"
    return LoginResponse(
        access_token=dev_token,
        refresh_token=dev_refresh,
        expires_in=3600,
        user=LoginUserInfo(
            id=f"dev-{uuid.uuid4().hex[:8]}",
            email=login_id if "@" in login_id else f"{login_id}@localhost",
            name=login_id.split("@")[0].replace(".", " ").title(),
            groups=["admin"],
        ),
    )


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    """Exchange username/password for Keycloak tokens and user info."""
    if not settings.auth_verify_token:
        logger.info("Dev mode: skipping Keycloak, returning dev tokens for %s", body.login_id)
        return _dev_login(body)

    try:
        async with httpx.AsyncClient(timeout=settings.proxy_timeout) as client:
            resp = await client.post(
                _TOKEN_URL,
                data={
                    "grant_type": "password",
                    "client_id": settings.auth_client_id,
                    "client_secret": settings.auth_client_secret,
                    "username": body.login_id,
                    "password": body.password,
                    "scope": "openid profile email",
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="Authentication failed")
    except httpx.HTTPError as exc:
        logger.error("Keycloak connection failed: %s", exc)
        raise HTTPException(status_code=502, detail="Authentication service unavailable")

    claims = _decode_jwt_payload(data["access_token"])
    user = LoginUserInfo(
        id=claims.get("sub", ""),
        email=claims.get("email", body.login_id),
        name=claims.get("name", claims.get("preferred_username", "")),
        groups=claims.get("groups", []),
    )

    return LoginResponse(
        access_token=data["access_token"],
        refresh_token=data["refresh_token"],
        expires_in=data.get("expires_in", 900),
        user=user,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest) -> TokenResponse:
    """Exchange a refresh token for new access + refresh tokens."""
    if not settings.auth_verify_token:
        return TokenResponse(
            access_token=f"dev-token-{uuid.uuid4().hex}",
            refresh_token=f"dev-refresh-{uuid.uuid4().hex}",
            expires_in=3600,
        )

    try:
        async with httpx.AsyncClient(timeout=settings.proxy_timeout) as client:
            resp = await client.post(
                _TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "client_id": settings.auth_client_id,
                    "client_secret": settings.auth_client_secret,
                    "refresh_token": body.refresh_token,
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="Token refresh failed")
    except httpx.HTTPError as exc:
        logger.error("Keycloak connection failed during refresh: %s", exc)
        raise HTTPException(status_code=502, detail="Authentication service unavailable")
    return TokenResponse(
        access_token=data["access_token"],
        refresh_token=data["refresh_token"],
        expires_in=data.get("expires_in", 900),
    )


@router.get("/me", response_model=UserInfo)
async def me(user: dict = Depends(require_auth)) -> UserInfo:
    """Return the current user's identity extracted from the JWT."""
    return UserInfo(
        sub=user.get("sub", ""),
        email=user.get("email", ""),
        groups=user.get("groups", []),
        preferred_username=user.get("preferred_username", ""),
    )
