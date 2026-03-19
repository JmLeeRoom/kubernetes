"""Tests for shared.auth – JWT verification and RBAC."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from jose import jwt as jose_jwt

from shared.auth import (
    TokenData,
    _determine_role,
    get_current_user,
    require_auth,
    require_group,
)
from shared.exceptions import ForbiddenError, UnauthorizedError


def _make_request(token: str | None = None) -> MagicMock:
    request = MagicMock()
    if token:
        request.headers = {"Authorization": f"Bearer {token}"}
    else:
        request.headers = {}
    return request


class TestDetermineRole:
    def test_admin_group(self):
        assert _determine_role(["admin", "viewer"]) == "admin"

    def test_ml_engineer_group(self):
        assert _determine_role(["ml-engineer"]) == "ml-engineer"

    def test_data_engineer_group(self):
        assert _determine_role(["data-engineer"]) == "data-engineer"

    def test_no_matching_group(self):
        assert _determine_role(["unknown"]) == "viewer"

    def test_empty_groups(self):
        assert _determine_role([]) == "viewer"


class TestGetCurrentUser:
    @patch("shared.auth._auth_settings")
    def test_no_token_returns_anonymous(self, mock_settings):
        mock_settings.verify_token = False
        request = _make_request()
        user = get_current_user(request)
        assert user["sub"] == "anonymous"
        assert user["role"] == "viewer"

    @patch("shared.auth._verify_and_decode")
    def test_valid_token_returns_user(self, mock_verify):
        mock_verify.return_value = {
            "sub": "user-123",
            "email": "test@example.com",
            "groups": ["admin"],
            "preferred_username": "testuser",
        }
        request = _make_request("valid-token")
        user = get_current_user(request)
        assert user["sub"] == "user-123"
        assert user["email"] == "test@example.com"
        assert user["role"] == "admin"
        assert "admin" in user["groups"]

    @patch("shared.auth._verify_and_decode")
    def test_invalid_token_raises(self, mock_verify):
        mock_verify.side_effect = UnauthorizedError(detail="bad token")
        request = _make_request("bad-token")
        with pytest.raises(UnauthorizedError):
            get_current_user(request)


class TestRequireAuth:
    def test_anonymous_raises(self):
        with pytest.raises(UnauthorizedError):
            require_auth({"sub": "anonymous", "role": "viewer"})

    def test_authenticated_passes(self):
        user = {"sub": "user-1", "role": "admin"}
        result = require_auth(user)
        assert result["sub"] == "user-1"


class TestRequireGroup:
    @pytest.mark.asyncio
    async def test_correct_group_passes(self):
        dep = require_group("admin")
        user = {"sub": "u1", "groups": ["admin"], "role": "admin"}
        result = await dep(user)
        assert result["sub"] == "u1"

    @pytest.mark.asyncio
    async def test_wrong_group_raises(self):
        dep = require_group("admin")
        user = {"sub": "u1", "groups": ["viewer"], "role": "viewer"}
        with pytest.raises(ForbiddenError):
            await dep(user)

    @pytest.mark.asyncio
    async def test_no_groups_raises(self):
        dep = require_group("ml-engineer")
        user = {"sub": "u1", "groups": [], "role": "viewer"}
        with pytest.raises(ForbiddenError):
            await dep(user)
