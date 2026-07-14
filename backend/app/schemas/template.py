from pydantic import BaseModel, Field

from app.models.job import JobType


class JobTemplateRead(BaseModel):
    id: str
    name: str
    description: str
    job_type: JobType
    source_system: str
    target_system: str
    default_job_name: str
    schedule_cron: str | None = None
    config: dict = Field(default_factory=dict)
    integration_mode: str = Field(
        default="simulated",
        description="simulated = metadata only; integrated = live connector (post-MVP)",
    )
