import pytest
import respx
import httpx

from mlops_svc.config import settings

MLFLOW_URL = settings.mlflow_url


@pytest.mark.asyncio
async def test_list_experiments(mlops_client):
    with respx.mock:
        respx.get(f"{MLFLOW_URL}/api/2.0/mlflow/experiments/list").mock(
            return_value=httpx.Response(
                200,
                json={
                    "experiments": [
                        {
                            "experiment_id": "1",
                            "name": "exp-1",
                            "artifact_location": "s3://bucket/1",
                            "lifecycle_stage": "active",
                        }
                    ]
                },
            )
        )
        resp = await mlops_client.get("/experiments/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "exp-1"


@pytest.mark.asyncio
async def test_list_runs(mlops_client):
    with respx.mock:
        respx.post(f"{MLFLOW_URL}/api/2.0/mlflow/runs/search").mock(
            return_value=httpx.Response(
                200,
                json={
                    "runs": [
                        {
                            "info": {
                                "run_id": "r1",
                                "experiment_id": "1",
                                "status": "FINISHED",
                                "start_time": 1700000000,
                            },
                            "data": {"metrics": [], "params": [], "tags": []},
                        }
                    ]
                },
            )
        )
        resp = await mlops_client.get("/experiments/1/runs")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["run_id"] == "r1"


@pytest.mark.asyncio
async def test_compare_runs(mlops_client):
    with respx.mock:
        respx.get(f"{MLFLOW_URL}/api/2.0/mlflow/runs/get").mock(
            return_value=httpx.Response(
                200,
                json={
                    "run": {
                        "info": {
                            "run_id": "r1",
                            "experiment_id": "1",
                            "status": "FINISHED",
                            "start_time": 1700000000,
                        },
                        "data": {"metrics": [], "params": [], "tags": []},
                    }
                },
            )
        )
        resp = await mlops_client.post(
            "/experiments/runs/compare",
            json={"run_ids": ["r1", "r2"]},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2


@pytest.mark.asyncio
async def test_compare_runs_empty_ids(mlops_client):
    resp = await mlops_client.post(
        "/experiments/runs/compare",
        json={"run_ids": []},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_list_models(mlops_client):
    with respx.mock:
        respx.get(f"{MLFLOW_URL}/api/2.0/mlflow/registered-models/list").mock(
            return_value=httpx.Response(
                200,
                json={
                    "registered_models": [
                        {"name": "model-a", "latest_versions": [], "description": "A"}
                    ]
                },
            )
        )
        resp = await mlops_client.get("/experiments/models")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "model-a"


@pytest.mark.asyncio
async def test_get_model_versions(mlops_client):
    with respx.mock:
        respx.get(f"{MLFLOW_URL}/api/2.0/mlflow/registered-models/get").mock(
            return_value=httpx.Response(
                200,
                json={
                    "registered_model": {
                        "name": "model-a",
                        "latest_versions": [
                            {
                                "name": "model-a",
                                "version": "1",
                                "current_stage": "Production",
                                "status": "READY",
                                "source": "s3://m",
                            }
                        ],
                    }
                },
            )
        )
        resp = await mlops_client.get("/experiments/models/model-a/versions")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["current_stage"] == "Production"


@pytest.mark.asyncio
async def test_transition_stage(mlops_client):
    with respx.mock:
        respx.post(
            f"{MLFLOW_URL}/api/2.0/mlflow/model-versions/transition-stage"
        ).mock(
            return_value=httpx.Response(
                200,
                json={
                    "model_version": {
                        "name": "model-a",
                        "version": "1",
                        "current_stage": "Staging",
                        "status": "READY",
                        "source": "s3://m",
                    }
                },
            )
        )
        resp = await mlops_client.post(
            "/experiments/models/model-a/versions/1/stage",
            json={"stage": "Staging"},
        )
        assert resp.status_code == 200
        assert resp.json()["current_stage"] == "Staging"
