import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.v1.responses import ERROR_RESPONSES
from app.core.deps import get_db
from app.models.job import JobStatus, JobType
from app.schemas.job import JobCreate, JobListResponse, JobRead, JobUpdate
from app.schemas.template import JobTemplateRead
from app.services.job_service import JobService
from app.services.template_service import list_job_templates
from sqlalchemy.orm import Session

router = APIRouter(prefix="/jobs", tags=["jobs"])


def get_job_service(db: Session = Depends(get_db)) -> JobService:
    return JobService(db)


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
        "Returns the four organization pipeline templates with schedule and config metadata. "
        "`integration_mode` is `simulated` in MVP — no live Epicor/Fabric/Lake House calls."
    ),
)
def get_job_templates() -> list[JobTemplateRead]:
    return list_job_templates()


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
