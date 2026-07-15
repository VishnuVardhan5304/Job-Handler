"""Add problem status and job_solutions table

Revision ID: 002_job_solutions
Revises: 001_initial
Create Date: 2026-07-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002_job_solutions"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

problem_status_enum = postgresql.ENUM(
    "open",
    "closed",
    name="problem_status_enum",
    create_type=False,
)


def upgrade() -> None:
    problem_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "job_problems",
        sa.Column(
            "status",
            problem_status_enum,
            nullable=False,
            server_default="open",
        ),
    )

    # Backfill from existing resolved_at values
    op.execute(
        """
        UPDATE job_problems
        SET status = CASE
            WHEN resolved_at IS NOT NULL THEN 'closed'::problem_status_enum
            ELSE 'open'::problem_status_enum
        END
        """
    )

    op.create_index("idx_job_problems_status", "job_problems", ["status"], unique=False)

    op.create_table(
        "job_solutions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("job_problem_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("summary", sa.String(length=255), nullable=False),
        sa.Column("details", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["job_problem_id"], ["job_problems.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_job_solutions_problem_id", "job_solutions", ["job_problem_id"], unique=False)
    op.create_index("idx_job_solutions_created_at", "job_solutions", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_job_solutions_created_at", table_name="job_solutions")
    op.drop_index("idx_job_solutions_problem_id", table_name="job_solutions")
    op.drop_table("job_solutions")
    op.drop_index("idx_job_problems_status", table_name="job_problems")
    op.drop_column("job_problems", "status")
    problem_status_enum.drop(op.get_bind(), checkfirst=True)
