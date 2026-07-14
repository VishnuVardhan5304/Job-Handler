import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.job import JobStatus, JobType
from app.schemas.job import JobCreate, JobListResponse, JobRead, JobUpdate
from app.schemas.template import JobTemplateRead
from app.services.job_service import JobService
from app.services.template_service import list_job_templates

router = APIRouter(prefix="/jobs", tags=["jobs"])


def get_job_service(db: Session = Depends(get_db)) -> JobService:
    return JobService(db)


@router.get("", response_model=JobListResponse, summary="List jobs with search and filters")
def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, description="Search by job name"),
    job_type: JobType | None = Query(None),
    status: JobStatus | None = Query(None),
    include_archived: bool = Query(False),
    sort_by: str = Query("updated_at"),
    sort_order: str = Query("desc"),
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


@router.post("", response_model=JobRead, status_code=status.HTTP_201_CREATED, summary="Create a job")
def create_job(
    payload: JobCreate,
    service: JobService = Depends(get_job_service),
) -> JobRead:
    return service.create_job(payload)


@router.get("/templates", response_model=list[JobTemplateRead], summary="List pipeline job templates")
def get_job_templates() -> list[JobTemplateRead]:
    return list_job_templates()


@router.get("/{job_id}", response_model=JobRead, summary="Get job by ID")
def get_job(
    job_id: uuid.UUID,
    service: JobService = Depends(get_job_service),
) -> JobRead:
    return service.get_job(job_id)


@router.patch("/{job_id}", response_model=JobRead, summary="Update a job")
def update_job(
    job_id: uuid.UUID,
    payload: JobUpdate,
    service: JobService = Depends(get_job_service),
) -> JobRead:
    return service.update_job(job_id, payload)


@router.post("/{job_id}/archive", response_model=JobRead, summary="Archive a job")
def archive_job(
    job_id: uuid.UUID,
    service: JobService = Depends(get_job_service),
) -> JobRead:
    return service.archive_job(job_id)
