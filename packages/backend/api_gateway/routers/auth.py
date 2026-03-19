"""Authentication endpoints: login, refresh, and user info."""

from __future__ import annotations

from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from api_gateway.config import settings
from shared.auth import get_current_user, require_auth

router = APIRouter()

_TOKEN_URL = (
    f"{settings.auth_keycloak_url}/realms/{settings.auth_realm}"
    "/protocol/openid-connect/token"
)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900


class UserInfo(BaseModel):
    sub: str
    email: str
    groups: list[str]
    preferred_username: str


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest) -> TokenResponse:
    """Exchange username/password for Keycloak tokens."""
    try:
        async with httpx.AsyncClient(timeout=settings.proxy_timeout) as client:
            resp = await client.post(
                _TOKEN_URL,
                data={
                    "grant_type": "password",
                    "client_id": settings.auth_client_id,
                    "client_secret": settings.auth_client_secret,
                    "username": body.username,
                    "password": body.password,
                    "scope": "openid profile email",
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="Authentication failed")
    return TokenResponse(
        access_token=data["access_token"],
        refresh_token=data["refresh_token"],
        expires_in=data.get("expires_in", 900),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: dict) -> TokenResponse:
    """Exchange a refresh token for new access + refresh tokens."""
    async with httpx.AsyncClient(timeout=settings.proxy_timeout) as client:
        resp = await client.post(
            _TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "client_id": settings.auth_client_id,
                "client_secret": settings.auth_client_secret,
                "refresh_token": body.get("refreshToken", ""),
            },
        )
        resp.raise_for_status()
        data = resp.json()
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
