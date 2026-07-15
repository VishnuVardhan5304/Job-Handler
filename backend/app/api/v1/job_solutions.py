import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.v1.responses import ERROR_RESPONSES
from app.core.deps import get_db
from app.schemas.solution import JobSolutionCreate, JobSolutionListResponse, JobSolutionRead
from app.services.solution_service import SolutionService

router = APIRouter(tags=["job-solutions"])


def get_solution_service(db: Session = Depends(get_db)) -> SolutionService:
    return SolutionService(db)


@router.get(
    "/jobs/{job_id}/solutions",
    response_model=JobSolutionListResponse,
    summary="List solutions for a job",
    description="Paginated JobSolutions for problems belonging to this job. Optional filter by job_problem_id.",
    responses=ERROR_RESPONSES,
)
def list_job_solutions(
    job_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    job_problem_id: uuid.UUID | None = Query(None, description="Filter to one problem"),
    sort_order: str = Query("desc"),
    service: SolutionService = Depends(get_solution_service),
) -> JobSolutionListResponse:
    return service.list_for_job(
        job_id,
        page=page,
        page_size=page_size,
        job_problem_id=job_problem_id,
        sort_order=sort_order,
    )


@router.post(
    "/jobs/{job_id}/solutions",
    response_model=JobSolutionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add a solution for a job problem",
    description=(
        "Creates a JobSolution linked to `job_problem_id`. "
        "Closing the problem requires a separate resolve/close action and is only allowed after a solution exists."
    ),
    responses=ERROR_RESPONSES,
)
def create_job_solution(
    job_id: uuid.UUID,
    payload: JobSolutionCreate,
    service: SolutionService = Depends(get_solution_service),
) -> JobSolutionRead:
    return service.create_for_job(job_id, payload)
