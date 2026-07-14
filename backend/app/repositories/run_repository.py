import math
import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.job import JobRun


class RunRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, run_id: uuid.UUID) -> JobRun | None:
        return self.db.get(JobRun, run_id)

    def list_runs(
        self,
        *,
        page: int,
        page_size: int,
        job_id: uuid.UUID | None,
        sort_order: str,
    ) -> tuple[list[JobRun], int]:
        query = select(JobRun)
        count_query = select(func.count()).select_from(JobRun)

        if job_id:
            query = query.where(JobRun.job_id == job_id)
            count_query = count_query.where(JobRun.job_id == job_id)

        if sort_order == "asc":
            query = query.order_by(JobRun.started_at.asc())
        else:
            query = query.order_by(JobRun.started_at.desc())

        total = self.db.scalar(count_query) or 0
        offset = (page - 1) * page_size
        runs = list(self.db.scalars(query.offset(offset).limit(page_size)).all())
        return runs, total

    def create(self, run: JobRun) -> JobRun:
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def update(self, run: JobRun) -> JobRun:
        self.db.commit()
        self.db.refresh(run)
        return run

    @staticmethod
    def pages(total: int, page_size: int) -> int:
        return max(1, math.ceil(total / page_size)) if total else 0
