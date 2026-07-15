import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class JobSolutionCreate(BaseModel):
    job_problem_id: uuid.UUID
    summary: str = Field(..., min_length=1, max_length=255)
    details: str = Field(..., min_length=1)
    metadata: dict | None = None

    @field_validator("summary", "details")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Cannot be blank")
        return value.strip()


class JobSolutionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    job_problem_id: uuid.UUID
    summary: str
    details: str
    metadata: dict | None = Field(default=None, validation_alias="metadata_")
    created_at: datetime
    updated_at: datetime


class JobSolutionListResponse(BaseModel):
    items: list[JobSolutionRead]
    total: int
    page: int
    page_size: int
    pages: int
