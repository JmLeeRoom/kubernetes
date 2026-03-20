"""Tests for the auth router (/api/v1/auth/*)."""

from __future__ import annotations

import base64
import json

import pytest
import respx
import httpx


def _make_mock_jwt(payload: dict) -> str:
    """Build a structurally valid (but unsigned) JWT for testing."""
    header = base64.urlsafe_b64encode(json.dumps({"alg": "none"}).encode()).rstrip(b"=")
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=")
    return f"{header.decode()}.{body.decode()}.sig"


_MOCK_JWT = _make_mock_jwt(
    {
        "sub": "user-001",
        "email": "admin@company.com",
        "name": "Admin User",
        "preferred_username": "admin",
        "groups": ["admin"],
    }
)


@pytest.mark.asyncio
@respx.mock
async def test_login_success(gateway_client, mock_redis):
    """POST /api/v1/auth/login should forward credentials to Keycloak."""
    respx.post(
        "https://keycloak.company.com/realms/mlops-platform/protocol/openid-connect/token"
    ).mock(
        return_value=httpx.Response(
            200,
            json={
                "access_token": _MOCK_JWT,
                "refresh_token": "fake-refresh",
                "expires_in": 900,
            },
        )
    )

    resp = await gateway_client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "secret"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["access_token"] == _MOCK_JWT
    assert data["refresh_token"] == "fake-refresh"
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["email"] == "admin@company.com"
    assert data["user"]["groups"] == ["admin"]


@pytest.mark.asyncio
@respx.mock
async def test_login_with_email_field(gateway_client, mock_redis):
    """POST /api/v1/auth/login should accept 'email' as login identifier."""
    respx.post(
        "https://keycloak.company.com/realms/mlops-platform/protocol/openid-connect/token"
    ).mock(
        return_value=httpx.Response(
            200,
            json={
                "access_token": _MOCK_JWT,
                "refresh_token": "fake-refresh",
                "expires_in": 900,
            },
        )
    )

    resp = await gateway_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@company.com", "password": "secret"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["email"] == "admin@company.com"


@pytest.mark.asyncio
@respx.mock
async def test_login_invalid_credentials(gateway_client, mock_redis):
    """POST /api/v1/auth/login returns 401 for bad credentials."""
    respx.post(
        "https://keycloak.company.com/realms/mlops-platform/protocol/openid-connect/token"
    ).mock(return_value=httpx.Response(401, json={"error": "invalid_grant"}))

    resp = await gateway_client.post(
        "/api/v1/auth/login",
        json={"username": "bad", "password": "bad"},
    )
    assert resp.status_code >= 400


@pytest.mark.asyncio
@respx.mock
async def test_refresh_token(gateway_client, mock_redis):
    """POST /api/v1/auth/refresh should exchange refresh token."""
    respx.post(
        "https://keycloak.company.com/realms/mlops-platform/protocol/openid-connect/token"
    ).mock(
        return_value=httpx.Response(
            200,
            json={
                "access_token": "new-access",
                "refresh_token": "new-refresh",
                "expires_in": 900,
            },
        )
    )

    resp = await gateway_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "old-refresh"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["access_token"] == "new-access"


@pytest.mark.asyncio
async def test_me_requires_auth(gateway_client, mock_redis):
    """GET /api/v1/auth/me without token should return 401."""
    resp = await gateway_client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_with_token(gateway_client, mock_redis):
    """GET /api/v1/auth/me with a valid bearer token returns user info."""
    resp = await gateway_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer fake-jwt-token"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "sub" in data
