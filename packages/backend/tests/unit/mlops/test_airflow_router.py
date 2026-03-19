import pytest
import respx
import httpx

from mlops_svc.config import settings

AIRFLOW_URL = settings.airflow_url


@pytest.mark.asyncio
async def test_list_dags(mlops_client):
    with respx.mock:
        respx.get(f"{AIRFLOW_URL}/api/v1/dags").mock(
            return_value=httpx.Response(
                200,
                json={
                    "dags": [
                        {
                            "dag_id": "ml-pipeline",
                            "is_paused": False,
                            "is_active": True,
                            "schedule_interval": "@daily",
                        }
                    ]
                },
            )
        )
        resp = await mlops_client.get("/dags/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["dag_id"] == "ml-pipeline"


@pytest.mark.asyncio
async def test_trigger_dag(mlops_client):
    with respx.mock:
        respx.post(f"{AIRFLOW_URL}/api/v1/dags/ml-pipeline/dagRuns").mock(
            return_value=httpx.Response(
                200,
                json={
                    "dag_run_id": "manual__1",
                    "dag_id": "ml-pipeline",
                    "state": "queued",
                },
            )
        )
        resp = await mlops_client.post(
            "/dags/ml-pipeline/trigger",
            json={"conf": {}},
        )
        assert resp.status_code == 200
        assert resp.json()["state"] == "queued"


@pytest.mark.asyncio
async def test_get_dag_graph(mlops_client):
    with respx.mock:
        respx.get(f"{AIRFLOW_URL}/api/v1/dags/ml-pipeline/tasks").mock(
            return_value=httpx.Response(
                200,
                json={
                    "tasks": [
                        {
                            "task_id": "extract",
                            "downstream_task_ids": ["transform"],
                            "task_type": "PythonOperator",
                        },
                        {
                            "task_id": "transform",
                            "downstream_task_ids": [],
                            "task_type": "PythonOperator",
                        },
                    ]
                },
            )
        )
        resp = await mlops_client.get("/dags/ml-pipeline/graph")
        assert resp.status_code == 200
        data = resp.json()
        assert data["dag_id"] == "ml-pipeline"
        assert len(data["tasks"]) == 2


@pytest.mark.asyncio
async def test_toggle_pause(mlops_client):
    with respx.mock:
        respx.patch(f"{AIRFLOW_URL}/api/v1/dags/ml-pipeline").mock(
            return_value=httpx.Response(
                200,
                json={"dag_id": "ml-pipeline", "is_paused": True},
            )
        )
        resp = await mlops_client.patch(
            "/dags/ml-pipeline/pause",
            json={"is_paused": True},
        )
        assert resp.status_code == 200
        assert resp.json()["is_paused"] is True


@pytest.mark.asyncio
async def test_list_dag_runs(mlops_client):
    with respx.mock:
        respx.get(f"{AIRFLOW_URL}/api/v1/dags/ml-pipeline/dagRuns").mock(
            return_value=httpx.Response(
                200,
                json={
                    "dag_runs": [
                        {
                            "dag_run_id": "run1",
                            "dag_id": "ml-pipeline",
                            "state": "success",
                            "execution_date": "2026-01-01T00:00:00Z",
                        }
                    ]
                },
            )
        )
        resp = await mlops_client.get("/dags/ml-pipeline/runs")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["state"] == "success"
