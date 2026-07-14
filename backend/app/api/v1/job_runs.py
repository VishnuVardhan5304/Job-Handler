import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.run import JobRunListResponse, JobRunRead
from app.services.run_service import RunService

router = APIRouter(tags=["job-runs"])


def get_run_service(db: Session = Depends(get_db)) -> RunService:
    return RunService(db)


@router.get(
    "/jobs/{job_id}/runs",
    response_model=JobRunListResponse,
    summary="List simulated runs for a job",
)
def list_job_runs(
    job_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_order: str = Query("desc"),
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
)
def simulate_job_run(
    job_id: uuid.UUID,
    service: RunService = Depends(get_run_service),
) -> JobRunRead:
    return service.simulate_run(job_id)
