"""Tests for the auth router (/api/v1/auth/*)."""

from __future__ import annotations

import pytest
import respx
import httpx


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
                "access_token": "fake-access",
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
    assert data["access_token"] == "fake-access"
    assert data["refresh_token"] == "fake-refresh"
    assert data["token_type"] == "bearer"


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
