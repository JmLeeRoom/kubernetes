from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_prefix": "MONITORING_"}

    service_name: str = "monitoring-svc"
    version: str = "0.1.0"
    debug: bool = False

    prometheus_url: str = "http://prometheus:9090"
    loki_url: str = "http://loki:3100"
    tempo_url: str = "http://tempo:3200"
    alertmanager_url: str = "http://alertmanager:9093"

    redis_url: str = "redis://localhost:6379/0"
    cache_ttl: int = 10

    cors_origins: list[str] = ["http://localhost:5173"]

    k8s_in_cluster: bool = False
    k8s_namespace: str = "default"


settings = Settings()
