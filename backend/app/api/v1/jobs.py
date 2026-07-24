import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.v1.responses import ERROR_RESPONSES
from app.core.deps import get_db
from app.models.job import JobStatus, JobType
from app.schemas.job import JobCreate, JobListResponse, JobRead, JobUpdate
from app.schemas.task_scheduler import TaskSchedulerSyncResponse
from app.schemas.template import JobTemplateRead
from app.services.job_service import JobService
from app.services.task_scheduler_sync_service import TaskSchedulerSyncService
from app.services.template_service import list_job_templates

router = APIRouter(prefix="/jobs", tags=["jobs"])


def get_job_service(db: Session = Depends(get_db)) -> JobService:
    return JobService(db)


def get_task_scheduler_sync_service(db: Session = Depends(get_db)) -> TaskSchedulerSyncService:
    return TaskSchedulerSyncService(db)


@router.get(
    "",
    response_model=JobListResponse,
    summary="List jobs with search and filters",
    description=(
        "Paginated job catalog. Archived jobs are excluded unless `include_archived=true`. "
        "Search matches job name (case-insensitive). "
        "Allowed `sort_by`: `name`, `status`, `updated_at`, `created_at`."
    ),
    responses=ERROR_RESPONSES,
)
def list_jobs(
    page: int = Query(1, ge=1, description="1-based page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    search: str | None = Query(None, description="Search by job name"),
    job_type: JobType | None = Query(None, description="Filter by pipeline type"),
    status: JobStatus | None = Query(None, description="Filter by job status"),
    include_archived: bool = Query(False, description="Include soft-archived jobs"),
    sort_by: str = Query("updated_at", description="Sort field"),
    sort_order: str = Query("desc", description="asc or desc"),
    service: JobService = Depends(get_job_service),
) -> JobListResponse:
    return service.list_jobs(
        page=page,
        page_size=page_size,
        search=search,
        job_type=job_type,
        status=status,
        include_archived=include_archived,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post(
    "",
    response_model=JobRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a job",
    description=(
        "Register a pipeline job. Omitting `source_system` / `target_system` applies "
        "pipeline defaults for the chosen `job_type`. Cannot create with status `archived` — "
        "use the archive endpoint after creation."
    ),
    responses=ERROR_RESPONSES,
)
def create_job(
    payload: JobCreate,
    service: JobService = Depends(get_job_service),
) -> JobRead:
    return service.create_job(payload)


@router.get(
    "/templates",
    response_model=list[JobTemplateRead],
    summary="List pipeline job templates",
    description=(
        "Returns organization pipeline templates with schedule and config metadata. "
        "`TASK_SCHEDULER` prefers Sync from the Jobs list over manual create."
    ),
)
def get_job_templates() -> list[JobTemplateRead]:
    return list_job_templates()


@router.post(
    "/sync/task-scheduler",
    response_model=TaskSchedulerSyncResponse,
    summary="Sync local Windows Task Scheduler tasks into Jobs",
    description=(
        "Discovers local Task Scheduler tasks and upserts Jobs of type `TASK_SCHEDULER`. "
        "Identity key is `config.task_path`. Sensitive / built-in Microsoft tasks are skipped. "
        "Missing tasks are soft-archived. Last-run outcome maps to JobRun; non-zero results "
        "may create an open JobProblem. Requires Windows + permission to read scheduled tasks."
    ),
    responses=ERROR_RESPONSES,
)
def sync_task_scheduler(
    service: TaskSchedulerSyncService = Depends(get_task_scheduler_sync_service),
) -> TaskSchedulerSyncResponse:
    return service.sync()


@router.get(
    "/{job_id}",
    response_model=JobRead,
    summary="Get job by ID",
    description="Returns one Job including archive timestamp if soft-deleted.",
    responses=ERROR_RESPONSES,
)
def get_job(
    job_id: uuid.UUID,
    service: JobService = Depends(get_job_service),
) -> JobRead:
    return service.get_job(job_id)


@router.patch(
    "/{job_id}",
    response_model=JobRead,
    summary="Update a job",
    description=(
        "Partial update. Archived jobs cannot be updated. "
        "Do not set status to `archived` here — use POST `.../archive`."
    ),
    responses=ERROR_RESPONSES,
)
def update_job(
    job_id: uuid.UUID,
    payload: JobUpdate,
    service: JobService = Depends(get_job_service),
) -> JobRead:
    return service.update_job(job_id, payload)


@router.post(
    "/{job_id}/archive",
    response_model=JobRead,
    summary="Archive a job",
    description="Soft-archive: sets `status=archived` and `archived_at`. Hidden from default lists.",
    responses=ERROR_RESPONSES,
)
def archive_job(
    job_id: uuid.UUID,
    service: JobService = Depends(get_job_service),
) -> JobRead:
    return service.archive_job(job_id)
