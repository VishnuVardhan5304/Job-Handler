import math
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.job import Job, JobStatus, JobType


class JobRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, job_id: uuid.UUID) -> Job | None:
        return self.db.get(Job, job_id)

    def list_jobs(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        job_type: JobType | None,
        status: JobStatus | None,
        include_archived: bool,
        sort_by: str,
        sort_order: str,
    ) -> tuple[list[Job], int]:
        query = select(Job)
        count_query = select(func.count()).select_from(Job)

        if not include_archived:
            query = query.where(Job.archived_at.is_(None))
            count_query = count_query.where(Job.archived_at.is_(None))

        if search:
            pattern = f"%{search.strip()}%"
            query = query.where(Job.name.ilike(pattern))
            count_query = count_query.where(Job.name.ilike(pattern))

        if job_type:
            query = query.where(Job.job_type == job_type)
            count_query = count_query.where(Job.job_type == job_type)

        if status:
            query = query.where(Job.status == status)
            count_query = count_query.where(Job.status == status)

        sort_column = {
            "name": Job.name,
            "status": Job.status,
            "updated_at": Job.updated_at,
            "created_at": Job.created_at,
        }.get(sort_by, Job.updated_at)

        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        total = self.db.scalar(count_query) or 0
        offset = (page - 1) * page_size
        jobs = list(self.db.scalars(query.offset(offset).limit(page_size)).all())
        return jobs, total

    def create(self, job: Job) -> Job:
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def update(self, job: Job) -> Job:
        job.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(job)
        return job

    def archive(self, job: Job) -> Job:
        now = datetime.now(timezone.utc)
        job.status = JobStatus.ARCHIVED
        job.archived_at = now
        job.updated_at = now
        self.db.commit()
        self.db.refresh(job)
        return job

    @staticmethod
    def pages(total: int, page_size: int) -> int:
        return max(1, math.ceil(total / page_size)) if total else 0
