from __future__ import annotations

import os
from typing import AsyncIterator
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

# Disable real JWT verification for all tests
os.environ.setdefault("AUTH_VERIFY_TOKEN", "false")

from api_gateway.main import create_app as create_gateway_app
from monitoring_svc.main import create_app as create_monitoring_app
from pipeline_svc.main import create_app as create_pipeline_app
from serving_svc.main import create_app as create_serving_app
from mlops_svc.main import create_app as create_mlops_app


@pytest.fixture
def app():
    return create_monitoring_app()


@pytest.fixture
async def client(app) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def pipeline_app():
    return create_pipeline_app()


@pytest.fixture
async def pipeline_client(pipeline_app) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=pipeline_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def serving_app():
    return create_serving_app()


@pytest.fixture
async def serving_client(serving_app) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=serving_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mlops_app():
    return create_mlops_app()


@pytest.fixture
async def mlops_client(mlops_app) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=mlops_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_redis():
    """Patch Redis so tests never need a real connection."""
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=None)
    mock.set = AsyncMock()
    mock.ping = AsyncMock()
    mock.incr = AsyncMock(return_value=1)
    mock.expire = AsyncMock()

    pipe_mock = AsyncMock()
    pipe_mock.incr = lambda *a, **kw: pipe_mock
    pipe_mock.expire = lambda *a, **kw: pipe_mock
    pipe_mock.execute = AsyncMock(return_value=[1, True])
    pipe_mock.__aenter__ = AsyncMock(return_value=pipe_mock)
    pipe_mock.__aexit__ = AsyncMock(return_value=False)
    mock.pipeline = lambda: pipe_mock

    with patch("shared.cache._redis", mock):
        yield mock


@pytest.fixture
def gateway_app():
    return create_gateway_app()


@pytest.fixture
async def gateway_client(gateway_app) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=gateway_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_prometheus_response():
    """Return a factory that builds Prometheus JSON responses."""

    def _build(result_type: str = "matrix", results: list | None = None):
        return {
            "status": "success",
            "data": {
                "resultType": result_type,
                "result": results or [],
            },
        }

    return _build
