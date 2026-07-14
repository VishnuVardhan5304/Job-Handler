import uuid

from fastapi import APIRouter, Depends, Query

from app.api.v1.responses import ERROR_RESPONSES
from app.core.deps import get_db
from app.models.job import ProblemSeverity
from app.schemas.problem import (
    JobProblemListResponse,
    JobProblemRead,
    JobProblemUpdate,
)
from app.services.problem_service import ProblemService
from sqlalchemy.orm import Session

router = APIRouter(prefix="/problems", tags=["problems"])


def get_problem_service(db: Session = Depends(get_db)) -> ProblemService:
    return ProblemService(db)


@router.get(
    "",
    response_model=JobProblemListResponse,
    summary="List all job problems",
    description=(
        "Global paginated JobProblem list. Filter by `job_id`, `severity`, and "
        "`unresolved_only`. Default sort is newest `occurred_at` first."
    ),
    responses=ERROR_RESPONSES,
)
def list_problems(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    job_id: uuid.UUID | None = Query(None, description="Filter by job"),
    severity: ProblemSeverity | None = Query(None),
    unresolved_only: bool = Query(False, description="Only problems with null resolved_at"),
    sort_order: str = Query("desc", description="asc or desc by occurred_at"),
    service: ProblemService = Depends(get_problem_service),
) -> JobProblemListResponse:
    return service.list_problems(
        page=page,
        page_size=page_size,
        job_id=job_id,
        severity=severity,
        unresolved_only=unresolved_only,
        sort_order=sort_order,
    )


@router.get(
    "/{problem_id}",
    response_model=JobProblemRead,
    summary="Get problem by ID",
    responses=ERROR_RESPONSES,
)
def get_problem(
    problem_id: uuid.UUID,
    service: ProblemService = Depends(get_problem_service),
) -> JobProblemRead:
    return service.get_problem(problem_id)


@router.patch(
    "/{problem_id}",
    response_model=JobProblemRead,
    summary="Update a problem",
    description="Update an unresolved JobProblem. Resolved problems cannot be edited.",
    responses=ERROR_RESPONSES,
)
def update_problem(
    problem_id: uuid.UUID,
    payload: JobProblemUpdate,
    service: ProblemService = Depends(get_problem_service),
) -> JobProblemRead:
    return service.update_problem(problem_id, payload)


@router.post(
    "/{problem_id}/resolve",
    response_model=JobProblemRead,
    summary="Resolve a problem",
    description="Sets `resolved_at` to now. Idempotent rejection if already resolved.",
    responses=ERROR_RESPONSES,
)
def resolve_problem(
    problem_id: uuid.UUID,
    service: ProblemService = Depends(get_problem_service),
) -> JobProblemRead:
    return service.resolve_problem(problem_id)
