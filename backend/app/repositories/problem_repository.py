import math
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.job import JobProblem, JobSolution, ProblemSeverity, ProblemStatus


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
            query = query.where(JobProblem.status == ProblemStatus.OPEN)
            count_query = count_query.where(JobProblem.status == ProblemStatus.OPEN)

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

    def close(self, problem: JobProblem) -> JobProblem:
        now = datetime.now(timezone.utc)
        problem.status = ProblemStatus.CLOSED
        problem.resolved_at = now
        problem.updated_at = now
        self.db.commit()
        self.db.refresh(problem)
        return problem

    def resolve(self, problem: JobProblem) -> JobProblem:
        return self.close(problem)

    @staticmethod
    def pages(total: int, page_size: int) -> int:
        return max(1, math.ceil(total / page_size)) if total else 0


class SolutionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, solution_id: uuid.UUID) -> JobSolution | None:
        return self.db.get(JobSolution, solution_id)

    def list_for_job(
        self,
        job_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
        job_problem_id: uuid.UUID | None = None,
        sort_order: str = "desc",
    ) -> tuple[list[JobSolution], int]:
        query = (
            select(JobSolution)
            .join(JobProblem, JobSolution.job_problem_id == JobProblem.id)
            .where(JobProblem.job_id == job_id)
        )
        count_query = (
            select(func.count())
            .select_from(JobSolution)
            .join(JobProblem, JobSolution.job_problem_id == JobProblem.id)
            .where(JobProblem.job_id == job_id)
        )

        if job_problem_id:
            query = query.where(JobSolution.job_problem_id == job_problem_id)
            count_query = count_query.where(JobSolution.job_problem_id == job_problem_id)

        if sort_order == "asc":
            query = query.order_by(JobSolution.created_at.asc())
        else:
            query = query.order_by(JobSolution.created_at.desc())

        total = self.db.scalar(count_query) or 0
        offset = (page - 1) * page_size
        items = list(self.db.scalars(query.offset(offset).limit(page_size)).all())
        return items, total

    def create(self, solution: JobSolution) -> JobSolution:
        self.db.add(solution)
        self.db.commit()
        self.db.refresh(solution)
        return solution

    @staticmethod
    def pages(total: int, page_size: int) -> int:
        return max(1, math.ceil(total / page_size)) if total else 0
