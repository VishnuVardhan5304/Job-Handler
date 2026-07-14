import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class JobType(str, enum.Enum):
    EPICOR_GD_WH_SYNC = "EPICOR_GD_WH_SYNC"
    TXT_TO_RPT = "TXT_TO_RPT"
    RPT_TO_FABRIC = "RPT_TO_FABRIC"
    DATAFLOW_TO_LAKEHOUSE = "DATAFLOW_TO_LAKEHOUSE"


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class ProblemSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RunStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


PIPELINE_DEFAULTS: dict[JobType, tuple[str, str]] = {
    JobType.EPICOR_GD_WH_SYNC: ("Epicor", "GD Warehouse"),
    JobType.TXT_TO_RPT: ("TXT", "RPT"),
    JobType.RPT_TO_FABRIC: ("RPT", "Fabric"),
    JobType.DATAFLOW_TO_LAKEHOUSE: ("Data Flow", "Lake House"),
}


def _enum_values(enum_cls: type[enum.Enum]) -> list[str]:
    return [member.value for member in enum_cls]


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    job_type: Mapped[JobType] = mapped_column(
        Enum(
            JobType,
            name="job_type_enum",
            values_callable=_enum_values,
            create_constraint=True,
            native_enum=True,
        ),
        nullable=False,
    )
    source_system: Mapped[str] = mapped_column(String(128), nullable=False)
    target_system: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[JobStatus] = mapped_column(
        Enum(
            JobStatus,
            name="job_status_enum",
            values_callable=_enum_values,
            create_constraint=True,
            native_enum=True,
        ),
        nullable=False,
        server_default=JobStatus.DRAFT.value,
    )
    schedule_cron: Mapped[str | None] = mapped_column(String(64), nullable=True)
    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    problems: Mapped[list["JobProblem"]] = relationship(back_populates="job")
    runs: Mapped[list["JobRun"]] = relationship(back_populates="job")

    __table_args__ = (
        Index("idx_jobs_job_type", "job_type"),
        Index("idx_jobs_status", "status"),
        Index("idx_jobs_updated_at", "updated_at"),
        Index(
            "idx_jobs_active",
            "updated_at",
            postgresql_where=text("archived_at IS NULL"),
        ),
    )


class JobProblem(Base):
    __tablename__ = "job_problems"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="RESTRICT"), nullable=False
    )
    severity: Mapped[ProblemSeverity] = mapped_column(
        Enum(
            ProblemSeverity,
            name="problem_severity_enum",
            values_callable=_enum_values,
            create_constraint=True,
            native_enum=True,
        ),
        nullable=False,
        server_default=ProblemSeverity.MEDIUM.value,
    )
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    job: Mapped["Job"] = relationship(back_populates="problems")

    __table_args__ = (
        Index("idx_job_problems_job_id", "job_id"),
        Index("idx_job_problems_severity", "severity"),
        Index(
            "idx_job_problems_unresolved",
            "job_id",
            "occurred_at",
            postgresql_where=text("resolved_at IS NULL"),
        ),
    )


class JobRun(Base):
    __tablename__ = "job_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[RunStatus] = mapped_column(
        Enum(
            RunStatus,
            name="run_status_enum",
            values_callable=_enum_values,
            create_constraint=True,
            native_enum=True,
        ),
        nullable=False,
        server_default=RunStatus.QUEUED.value,
    )
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    job: Mapped["Job"] = relationship(back_populates="runs")

    __table_args__ = (Index("idx_job_runs_job_id", "job_id", "started_at"),)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
