from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_prefix": "PIPELINE_"}

    service_name: str = "pipeline-svc"
    version: str = "0.1.0"
    debug: bool = False

    airbyte_url: str = "http://airbyte-server:8001"
    airbyte_username: str = "airbyte"
    airbyte_password: str = "password"
    airbyte_workspace_id: str = "default"

    prefect_url: str = "http://prefect-server:4200"

    spark_url: str = "http://spark-master:8080"

    redis_url: str = "redis://localhost:6379/0"
    cache_ttl: int = 30

    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
