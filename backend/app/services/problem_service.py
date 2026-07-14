import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models.job import JobProblem, utc_now
from app.repositories.job_repository import JobRepository
from app.repositories.problem_repository import ProblemRepository
from app.schemas.problem import (
    JobProblemCreate,
    JobProblemListResponse,
    JobProblemRead,
    JobProblemUpdate,
)
from app.models.job import ProblemSeverity


class ProblemService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ProblemRepository(db)
        self.job_repo = JobRepository(db)

    def list_problems(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        job_id: uuid.UUID | None = None,
        severity: ProblemSeverity | None = None,
        unresolved_only: bool = False,
        sort_order: str = "desc",
    ) -> JobProblemListResponse:
        if sort_order not in {"asc", "desc"}:
            raise ValidationError(
                detail="Invalid sort order",
                fields={"sort_order": "Must be asc or desc"},
            )

        problems, total = self.repo.list_problems(
            page=page,
            page_size=page_size,
            job_id=job_id,
            severity=severity,
            unresolved_only=unresolved_only,
            sort_order=sort_order,
        )
        return JobProblemListResponse(
            items=[JobProblemRead.model_validate(p) for p in problems],
            total=total,
            page=page,
            page_size=page_size,
            pages=self.repo.pages(total, page_size),
        )

    def list_for_job(
        self,
        job_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 20,
        severity: ProblemSeverity | None = None,
        unresolved_only: bool = True,
        sort_order: str = "desc",
    ) -> JobProblemListResponse:
        self._ensure_job_exists_and_active(job_id)
        return self.list_problems(
            page=page,
            page_size=page_size,
            job_id=job_id,
            severity=severity,
            unresolved_only=unresolved_only,
            sort_order=sort_order,
        )

    def get_problem(self, problem_id: uuid.UUID) -> JobProblemRead:
        problem = self._get_or_404(problem_id)
        return JobProblemRead.model_validate(problem)

    def create_for_job(self, job_id: uuid.UUID, payload: JobProblemCreate) -> JobProblemRead:
        self._ensure_job_exists_and_active(job_id)
        now = utc_now()
        problem = JobProblem(
            job_id=job_id,
            severity=payload.severity,
            code=payload.code,
            message=payload.message,
            metadata_=payload.metadata,
            occurred_at=payload.occurred_at or now,
            created_at=now,
            updated_at=now,
        )
        created = self.repo.create(problem)
        return JobProblemRead.model_validate(created)

    def update_problem(self, problem_id: uuid.UUID, payload: JobProblemUpdate) -> JobProblemRead:
        problem = self._get_or_404(problem_id)
        if problem.resolved_at is not None:
            raise ValidationError(
                detail="Cannot update a resolved problem",
                fields={"id": "Problem is already resolved"},
            )

        data = payload.model_dump(exclude_unset=True)
        if not data:
            raise ValidationError(detail="No fields provided for update")

        if "metadata" in data:
            problem.metadata_ = data.pop("metadata")

        for field, value in data.items():
            setattr(problem, field, value)

        updated = self.repo.update(problem)
        return JobProblemRead.model_validate(updated)

    def resolve_problem(self, problem_id: uuid.UUID) -> JobProblemRead:
        problem = self._get_or_404(problem_id)
        if problem.resolved_at is not None:
            raise ValidationError(
                detail="Problem is already resolved",
                fields={"id": "Already resolved"},
            )
        resolved = self.repo.resolve(problem)
        return JobProblemRead.model_validate(resolved)

    def _get_or_404(self, problem_id: uuid.UUID) -> JobProblem:
        problem = self.repo.get_by_id(problem_id)
        if problem is None:
            raise NotFoundError(detail=f"Problem {problem_id} not found")
        return problem

    def _ensure_job_exists_and_active(self, job_id: uuid.UUID) -> None:
        job = self.job_repo.get_by_id(job_id)
        if job is None:
            raise NotFoundError(detail=f"Job {job_id} not found")
        if job.archived_at is not None:
            raise ValidationError(
                detail="Cannot add or list problems for an archived job",
                fields={"job_id": "Job is archived"},
            )
