import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.job import ProblemSeverity
from app.schemas.problem import (
    JobProblemCreate,
    JobProblemListResponse,
    JobProblemRead,
    JobProblemUpdate,
)
from app.services.problem_service import ProblemService

router = APIRouter(prefix="/problems", tags=["problems"])


def get_problem_service(db: Session = Depends(get_db)) -> ProblemService:
    return ProblemService(db)


@router.get("", response_model=JobProblemListResponse, summary="List all job problems")
def list_problems(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    job_id: uuid.UUID | None = Query(None),
    severity: ProblemSeverity | None = Query(None),
    unresolved_only: bool = Query(False),
    sort_order: str = Query("desc"),
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


@router.get("/{problem_id}", response_model=JobProblemRead, summary="Get problem by ID")
def get_problem(
    problem_id: uuid.UUID,
    service: ProblemService = Depends(get_problem_service),
) -> JobProblemRead:
    return service.get_problem(problem_id)


@router.patch("/{problem_id}", response_model=JobProblemRead, summary="Update a problem")
def update_problem(
    problem_id: uuid.UUID,
    payload: JobProblemUpdate,
    service: ProblemService = Depends(get_problem_service),
) -> JobProblemRead:
    return service.update_problem(problem_id, payload)


@router.post("/{problem_id}/resolve", response_model=JobProblemRead, summary="Resolve a problem")
def resolve_problem(
    problem_id: uuid.UUID,
    service: ProblemService = Depends(get_problem_service),
) -> JobProblemRead:
    return service.resolve_problem(problem_id)
