from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_prefix": "SERVING_"}

    service_name: str = "serving-svc"
    version: str = "0.1.0"
    debug: bool = False

    kserve_namespace: str = "model-serving"
    prometheus_url: str = "http://prometheus.monitoring.svc.cluster.local:9090"

    redis_url: str = "redis://localhost:6379/0"
    cache_ttl: int = 30

    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
