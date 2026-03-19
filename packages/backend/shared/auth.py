"""Keycloak JWT verification and RBAC helpers."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

import httpx
from fastapi import Depends, Request
from jose import JWTError, jwt
from pydantic import BaseModel
from pydantic_settings import BaseSettings

from shared.exceptions import ForbiddenError, UnauthorizedError


class AuthSettings(BaseSettings):
    model_config = {"env_prefix": "AUTH_"}

    keycloak_url: str = "https://keycloak.company.com"
    realm: str = "mlops-platform"
    client_id: str = "mlops-dashboard"
    algorithms: list[str] = ["RS256"]
    verify_token: bool = True


_auth_settings = AuthSettings()


class TokenData(BaseModel):
    """Claims extracted from a verified JWT."""

    sub: str
    email: str = ""
    groups: list[str] = []
    preferred_username: str = ""
    role: str = "viewer"


@lru_cache(maxsize=1)
def _get_jwks(issuer_url: str) -> dict[str, Any]:
    """Fetch Keycloak's public JWKS (cached after first call)."""
    resp = httpx.get(f"{issuer_url}/protocol/openid-connect/certs", timeout=10)
    resp.raise_for_status()
    return resp.json()


def _issuer_url() -> str:
    return f"{_auth_settings.keycloak_url}/realms/{_auth_settings.realm}"


def _determine_role(groups: list[str]) -> str:
    if "admin" in groups:
        return "admin"
    if "ml-engineer" in groups:
        return "ml-engineer"
    if "data-engineer" in groups:
        return "data-engineer"
    return "viewer"


def _verify_and_decode(token: str) -> dict[str, Any]:
    """Verify a JWT against Keycloak JWKS and return the payload."""
    issuer = _issuer_url()

    if not _auth_settings.verify_token:
        try:
            payload = jwt.get_unverified_claims(token)
            return payload
        except JWTError:
            # In dev/test mode with verify_token=False, accept opaque tokens
            return {"sub": "dev-user", "email": "dev@localhost", "groups": ["admin"]}

    try:
        jwks = _get_jwks(issuer)
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if key is None:
            raise UnauthorizedError(detail="Unknown signing key")

        payload: dict[str, Any] = jwt.decode(
            token,
            key,
            algorithms=_auth_settings.algorithms,
            audience=_auth_settings.client_id,
            issuer=issuer,
        )
        return payload
    except JWTError as exc:
        raise UnauthorizedError(detail=f"Invalid token: {exc}")
    except httpx.HTTPError as exc:
        raise UnauthorizedError(detail=f"Could not validate token: {exc}")


def get_current_user(request: Request) -> dict[str, Any]:
    """Extract and verify JWT from the Authorization header.

    Returns a dict with at least ``sub`` and ``role`` keys.
    Falls back to anonymous/viewer when no token is present.
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer ") or len(auth) <= 7:
        return {"sub": "anonymous", "role": "viewer"}

    token = auth[7:]

    try:
        payload = _verify_and_decode(token)
    except UnauthorizedError:
        raise
    except Exception:
        return {"sub": "anonymous", "role": "viewer"}

    groups = payload.get("groups", [])
    return {
        "sub": payload.get("sub", "unknown"),
        "email": payload.get("email", ""),
        "groups": groups,
        "preferred_username": payload.get("preferred_username", ""),
        "role": _determine_role(groups),
    }


def require_auth(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Dependency that rejects anonymous users."""
    if user["sub"] == "anonymous":
        raise UnauthorizedError()
    return user


def require_group(group: str):
    """Dependency factory: require the user to belong to a specific Keycloak group."""

    async def _dependency(user: dict[str, Any] = Depends(require_auth)) -> dict[str, Any]:
        if group not in user.get("groups", []):
            raise ForbiddenError(detail=f"Group '{group}' required")
        return user

    return _dependency
