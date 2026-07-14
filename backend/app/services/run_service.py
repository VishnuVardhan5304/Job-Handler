import random
import uuid
from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models.job import JobRun, JobStatus, RunStatus, utc_now
from app.repositories.job_repository import JobRepository
from app.repositories.run_repository import RunRepository
from app.schemas.run import JobRunListResponse, JobRunRead


class RunService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = RunRepository(db)
        self.job_repo = JobRepository(db)

    def list_for_job(
        self,
        job_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 20,
        sort_order: str = "desc",
    ) -> JobRunListResponse:
        self._ensure_job_exists(job_id)
        if sort_order not in {"asc", "desc"}:
            raise ValidationError(
                detail="Invalid sort order",
                fields={"sort_order": "Must be asc or desc"},
            )

        runs, total = self.repo.list_runs(
            page=page,
            page_size=page_size,
            job_id=job_id,
            sort_order=sort_order,
        )
        return JobRunListResponse(
            items=[JobRunRead.model_validate(run) for run in runs],
            total=total,
            page=page,
            page_size=page_size,
            pages=self.repo.pages(total, page_size),
        )

    def simulate_run(self, job_id: uuid.UUID) -> JobRunRead:
        job = self.job_repo.get_by_id(job_id)
        if job is None:
            raise NotFoundError(detail=f"Job {job_id} not found")
        if job.archived_at is not None:
            raise ValidationError(
                detail="Cannot simulate runs for an archived job",
                fields={"job_id": "Job is archived"},
            )

        now = utc_now()
        run = JobRun(
            job_id=job_id,
            status=RunStatus.QUEUED,
            started_at=now,
            created_at=now,
        )
        run = self.repo.create(run)

        run.status = RunStatus.RUNNING
        run = self.repo.update(run)

        succeeded = job.status != JobStatus.PAUSED and random.random() < 0.85
        duration_seconds = random.randint(1, 4)
        run.finished_at = now + timedelta(seconds=duration_seconds)

        if succeeded:
            run.status = RunStatus.SUCCEEDED
            run.message = (
                f"Simulated pipeline completed: {job.source_system} → {job.target_system}"
            )
        else:
            run.status = RunStatus.FAILED
            reason = (
                "job is paused"
                if job.status == JobStatus.PAUSED
                else "simulated connector error (MVP — no live integration)"
            )
            run.message = f"Simulated run failed — {reason}"

        run = self.repo.update(run)
        return JobRunRead.model_validate(run)

    def _ensure_job_exists(self, job_id: uuid.UUID) -> None:
        if self.job_repo.get_by_id(job_id) is None:
            raise NotFoundError(detail=f"Job {job_id} not found")
