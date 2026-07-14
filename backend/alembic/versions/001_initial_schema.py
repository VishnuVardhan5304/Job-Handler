"""Initial schema: jobs, job_problems, job_runs

Revision ID: 001_initial
Revises:
Create Date: 2026-07-14
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

job_type_enum = postgresql.ENUM(
    "EPICOR_GD_WH_SYNC",
    "TXT_TO_RPT",
    "RPT_TO_FABRIC",
    "DATAFLOW_TO_LAKEHOUSE",
    name="job_type_enum",
    create_type=False,
)
job_status_enum = postgresql.ENUM(
    "draft", "active", "paused", "archived", name="job_status_enum", create_type=False
)
problem_severity_enum = postgresql.ENUM(
    "low", "medium", "high", "critical", name="problem_severity_enum", create_type=False
)
run_status_enum = postgresql.ENUM(
    "queued", "running", "succeeded", "failed", name="run_status_enum", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    job_type_enum.create(bind, checkfirst=True)
    job_status_enum.create(bind, checkfirst=True)
    problem_severity_enum.create(bind, checkfirst=True)
    run_status_enum.create(bind, checkfirst=True)

    op.create_table(
        "jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("job_type", job_type_enum, nullable=False),
        sa.Column("source_system", sa.String(length=128), nullable=False),
        sa.Column("target_system", sa.String(length=128), nullable=False),
        sa.Column("status", job_status_enum, server_default="draft", nullable=False),
        sa.Column("schedule_cron", sa.String(length=64), nullable=True),
        sa.Column("config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_jobs_job_type", "jobs", ["job_type"], unique=False)
    op.create_index("idx_jobs_status", "jobs", ["status"], unique=False)
    op.create_index("idx_jobs_updated_at", "jobs", ["updated_at"], unique=False)
    op.create_index(
        "idx_jobs_active",
        "jobs",
        ["updated_at"],
        unique=False,
        postgresql_where=sa.text("archived_at IS NULL"),
    )

    op.create_table(
        "job_problems",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("severity", problem_severity_enum, server_default="medium", nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_job_problems_job_id", "job_problems", ["job_id"], unique=False)
    op.create_index("idx_job_problems_severity", "job_problems", ["severity"], unique=False)
    op.create_index(
        "idx_job_problems_unresolved",
        "job_problems",
        ["job_id", "occurred_at"],
        unique=False,
        postgresql_where=sa.text("resolved_at IS NULL"),
    )

    op.create_table(
        "job_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", run_status_enum, server_default="queued", nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_job_runs_job_id", "job_runs", ["job_id", "started_at"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_job_runs_job_id", table_name="job_runs")
    op.drop_table("job_runs")
    op.drop_index("idx_job_problems_unresolved", table_name="job_problems")
    op.drop_index("idx_job_problems_severity", table_name="job_problems")
    op.drop_index("idx_job_problems_job_id", table_name="job_problems")
    op.drop_table("job_problems")
    op.drop_index("idx_jobs_active", table_name="jobs")
    op.drop_index("idx_jobs_updated_at", table_name="jobs")
    op.drop_index("idx_jobs_status", table_name="jobs")
    op.drop_index("idx_jobs_job_type", table_name="jobs")
    op.drop_table("jobs")

    bind = op.get_bind()
    run_status_enum.drop(bind, checkfirst=True)
    problem_severity_enum.drop(bind, checkfirst=True)
    job_status_enum.drop(bind, checkfirst=True)
    job_type_enum.drop(bind, checkfirst=True)
