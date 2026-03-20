from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_prefix": "GATEWAY_"}

    service_name: str = "api-gateway"
    version: str = "0.1.0"
    debug: bool = False

    monitoring_svc_url: str = "http://monitoring-svc:8001"
    pipeline_svc_url: str = "http://pipeline-svc:8002"
    serving_svc_url: str = "http://serving-svc:8003"
    mlops_svc_url: str = "http://mlops-svc:8004"

    redis_url: str = "redis://localhost:6379/0"
    cors_origins: list[str] = ["http://localhost:5173"]

    rate_limit_requests: int = 100
    rate_limit_window: int = 60

    auth_keycloak_url: str = "https://keycloak.company.com"
    auth_realm: str = "mlops-platform"
    auth_client_id: str = "mlops-dashboard"
    auth_client_secret: str = ""
    auth_verify_token: bool = True

    proxy_timeout: int = 30


settings = Settings()
