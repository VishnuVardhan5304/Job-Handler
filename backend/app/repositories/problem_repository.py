import math
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.job import JobProblem, ProblemSeverity


class ProblemRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, problem_id: uuid.UUID) -> JobProblem | None:
        return self.db.get(JobProblem, problem_id)

    def list_problems(
        self,
        *,
        page: int,
        page_size: int,
        job_id: uuid.UUID | None,
        severity: ProblemSeverity | None,
        unresolved_only: bool,
        sort_order: str,
    ) -> tuple[list[JobProblem], int]:
        query = select(JobProblem)
        count_query = select(func.count()).select_from(JobProblem)

        if job_id:
            query = query.where(JobProblem.job_id == job_id)
            count_query = count_query.where(JobProblem.job_id == job_id)

        if severity:
            query = query.where(JobProblem.severity == severity)
            count_query = count_query.where(JobProblem.severity == severity)

        if unresolved_only:
            query = query.where(JobProblem.resolved_at.is_(None))
            count_query = count_query.where(JobProblem.resolved_at.is_(None))

        if sort_order == "asc":
            query = query.order_by(JobProblem.occurred_at.asc())
        else:
            query = query.order_by(JobProblem.occurred_at.desc())

        total = self.db.scalar(count_query) or 0
        offset = (page - 1) * page_size
        problems = list(self.db.scalars(query.offset(offset).limit(page_size)).all())
        return problems, total

    def create(self, problem: JobProblem) -> JobProblem:
        self.db.add(problem)
        self.db.commit()
        self.db.refresh(problem)
        return problem

    def update(self, problem: JobProblem) -> JobProblem:
        problem.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(problem)
        return problem

    def resolve(self, problem: JobProblem) -> JobProblem:
        now = datetime.now(timezone.utc)
        problem.resolved_at = now
        problem.updated_at = now
        self.db.commit()
        self.db.refresh(problem)
        return problem

    @staticmethod
    def pages(total: int, page_size: int) -> int:
        return max(1, math.ceil(total / page_size)) if total else 0
