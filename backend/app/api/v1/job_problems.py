import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.job import ProblemSeverity
from app.schemas.problem import JobProblemCreate, JobProblemListResponse, JobProblemRead
from app.services.problem_service import ProblemService

router = APIRouter(tags=["job-problems"])


def get_problem_service(db: Session = Depends(get_db)) -> ProblemService:
    return ProblemService(db)


@router.get(
    "/jobs/{job_id}/problems",
    response_model=JobProblemListResponse,
    summary="List problems for a job",
)
def list_job_problems(
    job_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    severity: ProblemSeverity | None = Query(None),
    unresolved_only: bool = Query(True),
    sort_order: str = Query("desc"),
    service: ProblemService = Depends(get_problem_service),
) -> JobProblemListResponse:
    return service.list_for_job(
        job_id,
        page=page,
        page_size=page_size,
        severity=severity,
        unresolved_only=unresolved_only,
        sort_order=sort_order,
    )


@router.post(
    "/jobs/{job_id}/problems",
    response_model=JobProblemRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a problem for a job",
)
def create_job_problem(
    job_id: uuid.UUID,
    payload: JobProblemCreate,
    service: ProblemService = Depends(get_problem_service),
) -> JobProblemRead:
    return service.create_for_job(job_id, payload)
