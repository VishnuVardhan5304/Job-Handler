import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models.job import PIPELINE_DEFAULTS, Job, JobStatus, JobType, utc_now
from app.repositories.job_repository import JobRepository
from app.schemas.job import JobCreate, JobListResponse, JobRead, JobUpdate


class JobService:
    def __init__(self, db: Session) -> None:
        self.repo = JobRepository(db)

    def list_jobs(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        job_type: JobType | None = None,
        status: JobStatus | None = None,
        include_archived: bool = False,
        sort_by: str = "updated_at",
        sort_order: str = "desc",
    ) -> JobListResponse:
        allowed_sort = {"name", "status", "updated_at", "created_at"}
        if sort_by not in allowed_sort:
            raise ValidationError(
                detail="Invalid sort field",
                fields={"sort_by": f"Must be one of: {', '.join(sorted(allowed_sort))}"},
            )
        if sort_order not in {"asc", "desc"}:
            raise ValidationError(
                detail="Invalid sort order",
                fields={"sort_order": "Must be asc or desc"},
            )

        jobs, total = self.repo.list_jobs(
            page=page,
            page_size=page_size,
            search=search,
            job_type=job_type,
            status=status,
            include_archived=include_archived,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return JobListResponse(
            items=[JobRead.model_validate(job) for job in jobs],
            total=total,
            page=page,
            page_size=page_size,
            pages=self.repo.pages(total, page_size),
        )

    def get_job(self, job_id: uuid.UUID) -> JobRead:
        job = self._get_or_404(job_id)
        return JobRead.model_validate(job)

    def create_job(self, payload: JobCreate) -> JobRead:
        if payload.status == JobStatus.ARCHIVED:
            raise ValidationError(
                detail="Cannot create a job as archived; archive after creation",
                fields={"status": "Use the archive action instead"},
            )

        now = utc_now()
        job = Job(
            name=payload.name.strip(),
            job_type=payload.job_type,
            source_system=payload.source_system,
            target_system=payload.target_system,
            status=payload.status,
            schedule_cron=payload.schedule_cron,
            config=payload.config,
            created_at=now,
            updated_at=now,
        )
        created = self.repo.create(job)
        return JobRead.model_validate(created)

    def update_job(self, job_id: uuid.UUID, payload: JobUpdate) -> JobRead:
        job = self._get_or_404(job_id)
        if job.archived_at is not None:
            raise ValidationError(detail="Cannot update an archived job", fields={"id": "Job is archived"})

        data = payload.model_dump(exclude_unset=True)
        if not data:
            raise ValidationError(detail="No fields provided for update")

        if data.get("status") == JobStatus.ARCHIVED:
            raise ValidationError(
                detail="Cannot set status to archived via update; use the archive action",
                fields={"status": "Use POST /jobs/{id}/archive"},
            )

        if "name" in data and data["name"]:
            data["name"] = data["name"].strip()

        if "job_type" in data:
            default_source, default_target = PIPELINE_DEFAULTS[data["job_type"]]
            if "source_system" not in data or data["source_system"] is None:
                data["source_system"] = default_source
            if "target_system" not in data or data["target_system"] is None:
                data["target_system"] = default_target

        for field, value in data.items():
            setattr(job, field, value)

        updated = self.repo.update(job)
        return JobRead.model_validate(updated)

    def archive_job(self, job_id: uuid.UUID) -> JobRead:
        job = self._get_or_404(job_id)
        if job.archived_at is not None:
            raise ValidationError(detail="Job is already archived", fields={"id": "Already archived"})
        archived = self.repo.archive(job)
        return JobRead.model_validate(archived)

    def _get_or_404(self, job_id: uuid.UUID) -> Job:
        job = self.repo.get_by_id(job_id)
        if job is None:
            raise NotFoundError(detail=f"Job {job_id} not found")
        return job
