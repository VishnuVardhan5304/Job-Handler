from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    detail: str
    code: str
    fields: dict[str, str] | None = None


class ValidationErrorResponse(ErrorResponse):
    fields: dict[str, str] = Field(default_factory=dict)
