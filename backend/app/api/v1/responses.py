"""Shared OpenAPI response snippets."""

from app.schemas.errors import ErrorResponse

ERROR_RESPONSES = {
    404: {"model": ErrorResponse, "description": "Resource not found (`code`: NOT_FOUND)"},
    422: {
        "model": ErrorResponse,
        "description": "Validation failed (`code`: VALIDATION_ERROR); may include `fields`",
    },
}
