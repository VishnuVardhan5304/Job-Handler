import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.job import ProblemSeverity


class JobProblemBase(BaseModel):
    severity: ProblemSeverity = ProblemSeverity.MEDIUM
    code: str = Field(..., min_length=1, max_length=64)
    message: str = Field(..., min_length=1)
    metadata: dict | None = None
    occurred_at: datetime | None = None

    @field_validator("code", "message")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Cannot be blank")
        return value.strip()


class JobProblemCreate(JobProblemBase):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "severity": "high",
                    "code": "SYNC_TIMEOUT",
                    "message": "Watermark sync exceeded 30 minutes",
                }
            ]
        }
    )


class JobProblemUpdate(BaseModel):
    severity: ProblemSeverity | None = None
    code: str | None = Field(default=None, min_length=1, max_length=64)
    message: str | None = Field(default=None, min_length=1)
    metadata: dict | None = None
    occurred_at: datetime | None = None

    @field_validator("code", "message")
    @classmethod
    def not_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Cannot be blank")
        return value.strip() if value else value


class JobProblemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    job_id: uuid.UUID
    severity: ProblemSeverity
    code: str
    message: str
    metadata: dict | None = Field(default=None, validation_alias="metadata_")
    occurred_at: datetime
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime


class JobProblemListResponse(BaseModel):
    items: list[JobProblemRead]
    total: int
    page: int
    page_size: int
    pages: int
