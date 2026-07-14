import logging
import time
import uuid

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.exceptions import AppError
from app.schemas.errors import ErrorResponse, ValidationErrorResponse

logger = logging.getLogger("job_handler")


def register_exception_handlers(app) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
        body = ErrorResponse(detail=exc.detail, code=exc.code, fields=exc.fields)
        return JSONResponse(status_code=exc.status_code, content=body.model_dump(exclude_none=True))

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
        code = "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
        body = ErrorResponse(detail=detail, code=code)
        return JSONResponse(status_code=exc.status_code, content=body.model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        fields: dict[str, str] = {}
        for err in exc.errors():
            loc = ".".join(str(part) for part in err.get("loc", []) if part != "body")
            fields[loc or "body"] = err.get("msg", "Invalid value")
        body = ValidationErrorResponse(
            detail="Validation failed",
            code="VALIDATION_ERROR",
            fields=fields,
        )
        return JSONResponse(status_code=422, content=body.model_dump())

    @app.exception_handler(Exception)
    async def unhandled_error_handler(_request: Request, _exc: Exception) -> JSONResponse:
        logger.exception("Unhandled server error")
        body = ErrorResponse(detail="Internal server error", code="INTERNAL_ERROR")
        return JSONResponse(status_code=500, content=body.model_dump())


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    SENSITIVE_KEYS = {"authorization", "password", "database_url", "token", "secret"}

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        start = time.perf_counter()

        logger.info(
            "request_started method=%s path=%s request_id=%s",
            request.method,
            request.url.path,
            request_id,
        )

        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                "request_failed method=%s path=%s request_id=%s",
                request.method,
                request.url.path,
                request_id,
            )
            raise

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            "request_completed method=%s path=%s status=%s duration_ms=%s request_id=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            request_id,
        )
        response.headers["X-Request-ID"] = request_id
        return response
