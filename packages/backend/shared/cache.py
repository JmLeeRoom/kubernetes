from __future__ import annotations

import json
from typing import Any

import redis.asyncio as aioredis
import structlog

logger = structlog.get_logger(__name__)

_redis: aioredis.Redis | None = None


async def init_redis(url: str = "redis://localhost:6379/0") -> aioredis.Redis:
    global _redis
    _redis = aioredis.from_url(url, decode_responses=True)
    await _redis.ping()
    logger.info("redis_connected", url=url)
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None


def get_redis() -> aioredis.Redis:
    if _redis is None:
        raise RuntimeError("Redis not initialised – call init_redis() first")
    return _redis


async def cache_get(key: str) -> Any | None:
    r = get_redis()
    raw = await r.get(key)
    if raw is None:
        return None
    return json.loads(raw)


async def cache_set(key: str, value: Any, ttl: int = 10) -> None:
    r = get_redis()
    await r.set(key, json.dumps(value), ex=ttl)
