from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_prefix": "MLOPS_"}

    service_name: str = "mlops-svc"
    version: str = "0.1.0"
    debug: bool = False

    mlflow_url: str = "http://mlflow:5000"
    airflow_url: str = "http://airflow-webserver:8080"
    airflow_username: str = "airflow"
    airflow_password: str = "airflow"

    redis_url: str = "redis://localhost:6379/0"
    cache_ttl: int = 30

    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
