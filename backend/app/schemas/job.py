import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.job import PIPELINE_DEFAULTS, JobStatus, JobType


class JobBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    job_type: JobType
    source_system: str | None = Field(default=None, max_length=128)
    target_system: str | None = Field(default=None, max_length=128)
    status: JobStatus = JobStatus.DRAFT
    schedule_cron: str | None = Field(default=None, max_length=64)
    config: dict | None = None

    @model_validator(mode="after")
    def apply_pipeline_defaults(self) -> "JobBase":
        default_source, default_target = PIPELINE_DEFAULTS[self.job_type]
        if not self.source_system:
            self.source_system = default_source
        if not self.target_system:
            self.target_system = default_target
        return self


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    job_type: JobType | None = None
    source_system: str | None = Field(default=None, max_length=128)
    target_system: str | None = Field(default=None, max_length=128)
    status: JobStatus | None = None
    schedule_cron: str | None = Field(default=None, max_length=64)
    config: dict | None = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Name cannot be blank")
        return value


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    job_type: JobType
    source_system: str
    target_system: str
    status: JobStatus
    schedule_cron: str | None
    config: dict | None
    created_at: datetime
    updated_at: datetime
    archived_at: datetime | None


class JobListResponse(BaseModel):
    items: list[JobRead]
    total: int
    page: int
    page_size: int
    pages: int
