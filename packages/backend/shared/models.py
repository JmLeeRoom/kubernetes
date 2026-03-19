from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str
    version: str = "0.1.0"
    timestamp: datetime | None = None


class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int = 1
    page_size: int = 50
