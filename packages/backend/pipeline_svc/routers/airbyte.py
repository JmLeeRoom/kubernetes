from __future__ import annotations

from fastapi import APIRouter

from pipeline_svc.clients.airbyte import AirbyteClient
from pipeline_svc.config import settings

router = APIRouter()


def _airbyte() -> AirbyteClient:
    return AirbyteClient(
        settings.airbyte_url,
        username=settings.airbyte_username,
        password=settings.airbyte_password,
    )


@router.get("/")
async def list_connections() -> list[dict]:
    client = _airbyte()
    try:
        return await client.list_connections(settings.airbyte_workspace_id)
    finally:
        await client.close()


@router.get("/{connection_id}")
async def get_connection(connection_id: str) -> dict:
    client = _airbyte()
    try:
        return await client.get_connection(connection_id)
    finally:
        await client.close()


@router.post("/{connection_id}/sync")
async def trigger_sync(connection_id: str) -> dict:
    client = _airbyte()
    try:
        return await client.trigger_sync(connection_id)
    finally:
        await client.close()


@router.get("/{connection_id}/jobs")
async def list_jobs(connection_id: str, limit: int = 10) -> list[dict]:
    client = _airbyte()
    try:
        return await client.get_jobs(connection_id, limit)
    finally:
        await client.close()
