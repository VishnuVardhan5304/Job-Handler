from pydantic import BaseModel, Field


class TaskSchedulerSyncResponse(BaseModel):
    created: int = 0
    updated: int = 0
    archived: int = 0
    skipped_sensitive: int = 0
    runs_added: int = 0
    problems_added: int = 0
    imported: int = 0
    message: str = Field(..., description="Human-readable sync summary")
