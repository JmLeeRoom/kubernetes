from fastapi import HTTPException, status


class NotFoundError(HTTPException):
    def __init__(self, detail: str = "Resource not found") -> None:
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class BadRequestError(HTTPException):
    def __init__(self, detail: str = "Bad request") -> None:
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class UnauthorizedError(HTTPException):
    def __init__(self, detail: str = "Not authenticated") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenError(HTTPException):
    def __init__(self, detail: str = "Permission denied") -> None:
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class UpstreamError(HTTPException):
    """Raised when an external service (Prometheus, Loki, K8s) fails."""

    def __init__(self, service: str, detail: str = "") -> None:
        msg = f"Upstream error from {service}"
        if detail:
            msg += f": {detail}"
        super().__init__(status_code=status.HTTP_502_BAD_GATEWAY, detail=msg)
