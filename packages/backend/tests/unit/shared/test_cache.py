"""Tests for the shared cache module."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from shared.cache import cache_get, cache_set, get_redis, init_redis, close_redis


@pytest.mark.asyncio
async def test_cache_get_returns_none_on_miss(mock_redis):
    """cache_get returns None when key does not exist."""
    result = await cache_get("nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_cache_set_stores_json(mock_redis):
    """cache_set stores value as JSON with TTL."""
    await cache_set("key", {"value": 42}, ttl=60)
    mock_redis.set.assert_called_once()


def test_get_redis_raises_when_not_initialized():
    """get_redis raises RuntimeError when Redis is not initialized."""
    with patch("shared.cache._redis", None):
        with pytest.raises(RuntimeError):
            get_redis()
