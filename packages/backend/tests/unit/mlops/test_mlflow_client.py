import pytest
import respx
import httpx

from mlops_svc.clients.mlflow_client import MLflowClient

MLFLOW_URL = "http://mlflow-test:5000"


@pytest.fixture
def mlflow_client():
    return MLflowClient(MLFLOW_URL)


@pytest.mark.asyncio
async def test_list_experiments(mlflow_client):
    with respx.mock:
        respx.get(f"{MLFLOW_URL}/api/2.0/mlflow/experiments/list").mock(
            return_value=httpx.Response(
                200,
                json={
                    "experiments": [
                        {
                            "experiment_id": "1",
                            "name": "test-exp",
                            "artifact_location": "s3://bucket/1",
                            "lifecycle_stage": "active",
                        }
                    ]
                },
            )
        )
        experiments = await mlflow_client.list_experiments()
        assert len(experiments) == 1
        assert experiments[0].experiment_id == "1"
        assert experiments[0].name == "test-exp"


@pytest.mark.asyncio
async def test_list_runs(mlflow_client):
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
                            "data": {
                                "metrics": [{"key": "acc", "value": 0.95}],
                                "params": [{"key": "lr", "value": "0.01"}],
                                "tags": [],
                            },
                        }
                    ]
                },
            )
        )
        runs = await mlflow_client.list_runs(["1"])
        assert len(runs) == 1
        assert runs[0].run_id == "r1"
        assert runs[0].metrics["acc"] == 0.95
        assert runs[0].params["lr"] == "0.01"


@pytest.mark.asyncio
async def test_get_run(mlflow_client):
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
                        "data": {
                            "metrics": [{"key": "loss", "value": 0.05}],
                            "params": [],
                            "tags": [],
                        },
                    }
                },
            )
        )
        run = await mlflow_client.get_run("r1")
        assert run.run_id == "r1"
        assert run.metrics["loss"] == 0.05


@pytest.mark.asyncio
async def test_compare_runs(mlflow_client):
    with respx.mock:
        for rid in ["r1", "r2"]:
            respx.get(f"{MLFLOW_URL}/api/2.0/mlflow/runs/get").mock(
                return_value=httpx.Response(
                    200,
                    json={
                        "run": {
                            "info": {
                                "run_id": rid,
                                "experiment_id": "1",
                                "status": "FINISHED",
                                "start_time": 1700000000,
                            },
                            "data": {
                                "metrics": [],
                                "params": [{"key": "lr", "value": "0.01"}],
                                "tags": [],
                            },
                        }
                    },
                )
            )
        runs = await mlflow_client.compare_runs(["r1", "r2"])
        assert len(runs) == 2
        assert all(r.params.get("lr") == "0.01" for r in runs)


@pytest.mark.asyncio
async def test_list_registered_models(mlflow_client):
    with respx.mock:
        respx.get(f"{MLFLOW_URL}/api/2.0/mlflow/registered-models/list").mock(
            return_value=httpx.Response(
                200,
                json={
                    "registered_models": [
                        {
                            "name": "fraud-detector",
                            "latest_versions": [],
                            "description": "Detects fraud",
                        }
                    ]
                },
            )
        )
        models = await mlflow_client.list_registered_models()
        assert len(models) == 1
        assert models[0].name == "fraud-detector"


@pytest.mark.asyncio
async def test_get_model_versions(mlflow_client):
    with respx.mock:
        respx.get(f"{MLFLOW_URL}/api/2.0/mlflow/registered-models/get").mock(
            return_value=httpx.Response(
                200,
                json={
                    "registered_model": {
                        "name": "fraud-detector",
                        "latest_versions": [
                            {
                                "name": "fraud-detector",
                                "version": "3",
                                "current_stage": "Production",
                                "status": "READY",
                                "source": "s3://models/fd",
                                "run_id": "r1",
                            }
                        ],
                    }
                },
            )
        )
        versions = await mlflow_client.get_model_versions("fraud-detector")
        assert len(versions) == 1
        assert versions[0].version == "3"
        assert versions[0].current_stage == "Production"


@pytest.mark.asyncio
async def test_transition_model_stage(mlflow_client):
    with respx.mock:
        respx.post(
            f"{MLFLOW_URL}/api/2.0/mlflow/model-versions/transition-stage"
        ).mock(
            return_value=httpx.Response(
                200,
                json={
                    "model_version": {
                        "name": "fraud-detector",
                        "version": "3",
                        "current_stage": "Staging",
                        "status": "READY",
                        "source": "s3://models/fd",
                        "run_id": "r1",
                    }
                },
            )
        )
        mv = await mlflow_client.transition_model_stage(
            "fraud-detector", "3", "Staging"
        )
        assert mv.current_stage == "Staging"
