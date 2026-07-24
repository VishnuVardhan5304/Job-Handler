"""Sync local Windows Task Scheduler tasks into Jobs / JobRuns / JobProblems."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.domain.task_scheduler import DiscoveredTask, discover_local_tasks
from app.models.job import (
    PIPELINE_DEFAULTS,
    Job,
    JobProblem,
    JobRun,
    JobStatus,
    JobType,
    ProblemSeverity,
    ProblemStatus,
    RunStatus,
    utc_now,
)
from app.repositories.job_repository import JobRepository
from app.schemas.task_scheduler import TaskSchedulerSyncResponse


class TaskSchedulerSyncService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = JobRepository(db)

    def sync(self) -> TaskSchedulerSyncResponse:
        try:
            importable, skipped = discover_local_tasks()
        except RuntimeError as exc:
            raise AppError(detail=str(exc), code="TASK_SCHEDULER_UNAVAILABLE", status_code=503) from exc

        existing = self.repo.list_task_scheduler_jobs(include_archived=True)
        by_path: dict[str, Job] = {}
        for job in existing:
            path = _task_path_from_config(job.config)
            if path:
                by_path[path] = job

        created = 0
        updated = 0
        archived = 0
        runs_added = 0
        problems_added = 0
        seen_paths: set[str] = set()

        for task in importable:
            seen_paths.add(task.task_path)
            job = by_path.get(task.task_path)
            if job is None:
                job = self._create_job(task)
                by_path[task.task_path] = job
                created += 1
            else:
                changed = self._update_job(job, task)
                if changed:
                    updated += 1

            run_created = self._sync_last_run(job, task)
            if run_created:
                runs_added += 1
            problem_created = self._sync_failure_problem(job, task)
            if problem_created:
                problems_added += 1

        for path, job in by_path.items():
            if path in seen_paths:
                continue
            if job.archived_at is not None:
                continue
            self.repo.archive(job)
            archived += 1

        return TaskSchedulerSyncResponse(
            created=created,
            updated=updated,
            archived=archived,
            skipped_sensitive=len(skipped),
            runs_added=runs_added,
            problems_added=problems_added,
            imported=len(importable),
            message=(
                f"Synced {len(importable)} Task Scheduler task(s); "
                f"skipped {len(skipped)} sensitive/built-in."
            ),
        )

    def _create_job(self, task: DiscoveredTask) -> Job:
        source, target = PIPELINE_DEFAULTS[JobType.TASK_SCHEDULER]
        now = utc_now()
        job = Job(
            name=_job_name(task),
            job_type=JobType.TASK_SCHEDULER,
            source_system=source,
            target_system=target,
            status=JobStatus.ACTIVE if task.enabled else JobStatus.PAUSED,
            schedule_cron=task.schedule_summary,
            config=_safe_config(task),
            created_at=now,
            updated_at=now,
        )
        return self.repo.create(job)

    def _update_job(self, job: Job, task: DiscoveredTask) -> bool:
        config = _safe_config(task)
        desired_status = JobStatus.ACTIVE if task.enabled else JobStatus.PAUSED
        changed = False

        if job.archived_at is not None:
            job.archived_at = None
            changed = True

        if job.name != _job_name(task):
            job.name = _job_name(task)
            changed = True

        if job.status != desired_status and job.status != JobStatus.DRAFT:
            job.status = desired_status
            changed = True
        elif job.archived_at is None and job.status == JobStatus.ARCHIVED:
            job.status = desired_status
            changed = True

        if job.schedule_cron != task.schedule_summary:
            job.schedule_cron = task.schedule_summary
            changed = True

        if job.config != config:
            # Preserve last_synced_run_key across updates.
            prev = job.config or {}
            if prev.get("last_synced_run_key"):
                config["last_synced_run_key"] = prev["last_synced_run_key"]
            job.config = config
            changed = True

        if changed:
            self.repo.update(job)
        return changed

    def _sync_last_run(self, job: Job, task: DiscoveredTask) -> bool:
        if not task.last_run_time:
            return False

        run_key = f"{task.last_run_time}|{task.last_task_result}"
        config = dict(job.config or {})
        if config.get("last_synced_run_key") == run_key:
            return False

        result = task.last_task_result
        # 267011 often means "never run" on Windows — skip empty history noise.
        if result == 267011 and not _is_real_datetime(task.last_run_time):
            return False

        status = RunStatus.SUCCEEDED if result == 0 else RunStatus.FAILED
        if result is None:
            status = RunStatus.SUCCEEDED

        started = _parse_dt(task.last_run_time) or utc_now()
        message = (
            f"Task Scheduler last result={result}"
            if result is not None
            else "Task Scheduler last run imported"
        )
        run = JobRun(
            job_id=job.id,
            status=status,
            message=message,
            started_at=started,
            finished_at=started,
            created_at=utc_now(),
        )
        self.db.add(run)
        config["last_synced_run_key"] = run_key
        config["last_run_time"] = task.last_run_time
        config["last_task_result"] = task.last_task_result
        job.config = config
        job.updated_at = utc_now()
        self.db.commit()
        self.db.refresh(job)
        return True

    def _sync_failure_problem(self, job: Job, task: DiscoveredTask) -> bool:
        if task.last_task_result is None or task.last_task_result == 0:
            return False
        if task.last_task_result == 267011:
            return False

        occurred = _parse_dt(task.last_run_time) or utc_now()
        code = f"TASK_RESULT_{task.last_task_result}"

        existing_open = self.repo.find_open_problem_by_code(job.id, code)
        if existing_open is not None:
            return False

        problem = JobProblem(
            job_id=job.id,
            severity=ProblemSeverity.HIGH,
            code=code,
            message=f"Task Scheduler task finished with result {task.last_task_result}",
            metadata_={
                "source": "windows_task_scheduler",
                "task_path": task.task_path,
                "last_run_time": task.last_run_time,
                "last_task_result": task.last_task_result,
            },
            status=ProblemStatus.OPEN,
            occurred_at=occurred,
            created_at=utc_now(),
            updated_at=utc_now(),
        )
        self.db.add(problem)
        self.db.commit()
        return True


def _job_name(task: DiscoveredTask) -> str:
    name = f"TS: {task.task_name}"
    return name[:255]


def _safe_config(task: DiscoveredTask) -> dict[str, Any]:
    """Safe metadata only — never Execute/Arguments/credentials."""
    return {
        "integration": "windows_task_scheduler",
        "task_path": task.task_path,
        "task_name": task.task_name,
        "folder": task.folder,
        "enabled": task.enabled,
        "state": task.state,
        "schedule_summary": task.schedule_summary,
        "last_run_time": task.last_run_time,
        "last_task_result": task.last_task_result,
    }


def _task_path_from_config(config: dict | None) -> str | None:
    if not config:
        return None
    path = config.get("task_path")
    return str(path) if path else None


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    text = value.strip()
    if not text or text.startswith("0001-01-01") or text.startswith("1899-"):
        return None
    try:
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        dt = datetime.fromisoformat(text)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def _is_real_datetime(value: str | None) -> bool:
    return _parse_dt(value) is not None
