import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.v1.responses import ERROR_RESPONSES
from app.core.deps import get_db
from app.schemas.run import JobRunListResponse, JobRunRead
from app.services.run_service import RunService
from sqlalchemy.orm import Session

router = APIRouter(tags=["job-runs"])


def get_run_service(db: Session = Depends(get_db)) -> RunService:
    return RunService(db)


@router.get(
    "/jobs/{job_id}/runs",
    response_model=JobRunListResponse,
    summary="List simulated runs for a job",
    description=(
        "Paginated JobRun history (newest first by default). "
        "Runs are simulated in MVP — no live pipeline execution."
    ),
    responses=ERROR_RESPONSES,
)
def list_job_runs(
    job_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_order: str = Query("desc", description="asc or desc by started_at"),
    service: RunService = Depends(get_run_service),
) -> JobRunListResponse:
    return service.list_for_job(
        job_id,
        page=page,
        page_size=page_size,
        sort_order=sort_order,
    )


@router.post(
    "/jobs/{job_id}/runs/simulate",
    response_model=JobRunRead,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger a simulated pipeline run",
    description=(
        "Creates a JobRun and immediately transitions queued → running → succeeded|failed. "
        "Archived jobs cannot be simulated. Paused jobs tend to fail with an explanatory message. "
        "No external systems are called."
    ),
    responses=ERROR_RESPONSES,
)
def simulate_job_run(
    job_id: uuid.UUID,
    service: RunService = Depends(get_run_service),
) -> JobRunRead:
    return service.simulate_run(job_id)
