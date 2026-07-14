import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.job import RunStatus


class JobRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    status: RunStatus
    message: str | None
    started_at: datetime
    finished_at: datetime | None
    created_at: datetime


class JobRunListResponse(BaseModel):
    items: list[JobRunRead]
    total: int
    page: int
    page_size: int
    pages: int
