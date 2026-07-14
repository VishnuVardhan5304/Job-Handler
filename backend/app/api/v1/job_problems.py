import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.v1.responses import ERROR_RESPONSES
from app.core.deps import get_db
from app.models.job import ProblemSeverity
from app.schemas.problem import JobProblemCreate, JobProblemListResponse, JobProblemRead
from app.services.problem_service import ProblemService
from sqlalchemy.orm import Session

router = APIRouter(tags=["job-problems"])


def get_problem_service(db: Session = Depends(get_db)) -> ProblemService:
    return ProblemService(db)


@router.get(
    "/jobs/{job_id}/problems",
    response_model=JobProblemListResponse,
    summary="List problems for a job",
    description=(
        "Paginated problems for one Job. History can be listed for archived jobs. "
        "Default `unresolved_only=true`."
    ),
    responses=ERROR_RESPONSES,
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
    description=(
        "Log an operational JobProblem against a Job. "
        "Blocked when the job is archived. Example code: `SYNC_TIMEOUT` or `RUN_FAILED`."
    ),
    responses=ERROR_RESPONSES,
)
def create_job_problem(
    job_id: uuid.UUID,
    payload: JobProblemCreate,
    service: ProblemService = Depends(get_problem_service),
) -> JobProblemRead:
    return service.create_for_job(job_id, payload)
