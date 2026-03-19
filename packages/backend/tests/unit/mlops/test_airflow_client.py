import pytest
import respx
import httpx

from mlops_svc.clients.airflow_client import AirflowClient

AIRFLOW_URL = "http://airflow-test:8080"


@pytest.fixture
def airflow_client():
    return AirflowClient(AIRFLOW_URL, "admin", "admin")


@pytest.mark.asyncio
async def test_list_dags(airflow_client):
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
        dags = await airflow_client.list_dags()
        assert len(dags) == 1
        assert dags[0].dag_id == "ml-pipeline"
        assert dags[0].is_active is True


@pytest.mark.asyncio
async def test_trigger_dag(airflow_client):
    with respx.mock:
        respx.post(f"{AIRFLOW_URL}/api/v1/dags/ml-pipeline/dagRuns").mock(
            return_value=httpx.Response(
                200,
                json={
                    "dag_run_id": "manual__2026-01-01",
                    "dag_id": "ml-pipeline",
                    "state": "queued",
                },
            )
        )
        result = await airflow_client.trigger_dag("ml-pipeline", conf={"key": "val"})
        assert result["state"] == "queued"


@pytest.mark.asyncio
async def test_get_dag_tasks(airflow_client):
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
        tasks = await airflow_client.get_dag_tasks("ml-pipeline")
        assert len(tasks) == 2
        assert tasks[0]["task_id"] == "extract"
        assert "transform" in tasks[0]["downstream_task_ids"]


@pytest.mark.asyncio
async def test_set_dag_paused(airflow_client):
    with respx.mock:
        respx.patch(f"{AIRFLOW_URL}/api/v1/dags/ml-pipeline").mock(
            return_value=httpx.Response(
                200,
                json={
                    "dag_id": "ml-pipeline",
                    "is_paused": True,
                },
            )
        )
        result = await airflow_client.set_dag_paused("ml-pipeline", True)
        assert result["is_paused"] is True


@pytest.mark.asyncio
async def test_list_dag_runs(airflow_client):
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
        runs = await airflow_client.list_dag_runs("ml-pipeline")
        assert len(runs) == 1
        assert runs[0].state == "success"
