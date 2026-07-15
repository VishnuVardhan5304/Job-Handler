import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models.job import JobSolution, utc_now
from app.repositories.job_repository import JobRepository
from app.repositories.problem_repository import ProblemRepository, SolutionRepository
from app.schemas.solution import JobSolutionCreate, JobSolutionListResponse, JobSolutionRead


class SolutionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = SolutionRepository(db)
        self.problem_repo = ProblemRepository(db)
        self.job_repo = JobRepository(db)

    def list_for_job(
        self,
        job_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 20,
        job_problem_id: uuid.UUID | None = None,
        sort_order: str = "desc",
    ) -> JobSolutionListResponse:
        if self.job_repo.get_by_id(job_id) is None:
            raise NotFoundError(detail=f"Job {job_id} not found")
        if sort_order not in {"asc", "desc"}:
            raise ValidationError(
                detail="Invalid sort order",
                fields={"sort_order": "Must be asc or desc"},
            )

        items, total = self.repo.list_for_job(
            job_id,
            page=page,
            page_size=page_size,
            job_problem_id=job_problem_id,
            sort_order=sort_order,
        )
        return JobSolutionListResponse(
            items=[JobSolutionRead.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=self.repo.pages(total, page_size),
        )

    def create_for_job(self, job_id: uuid.UUID, payload: JobSolutionCreate) -> JobSolutionRead:
        job = self.job_repo.get_by_id(job_id)
        if job is None:
            raise NotFoundError(detail=f"Job {job_id} not found")
        if job.archived_at is not None:
            raise ValidationError(
                detail="Cannot add solutions for an archived job",
                fields={"job_id": "Job is archived"},
            )

        problem = self.problem_repo.get_by_id(payload.job_problem_id)
        if problem is None or problem.job_id != job_id:
            raise NotFoundError(detail=f"Problem {payload.job_problem_id} not found for this job")

        now = utc_now()
        solution = JobSolution(
            job_problem_id=payload.job_problem_id,
            summary=payload.summary,
            details=payload.details,
            metadata_=payload.metadata,
            created_at=now,
            updated_at=now,
        )
        created = self.repo.create(solution)

        return JobSolutionRead.model_validate(created)
