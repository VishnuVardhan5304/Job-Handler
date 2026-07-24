"""Add TASK_SCHEDULER to job_type_enum

Revision ID: 003_task_scheduler_job_type
Revises: 002_job_solutions
Create Date: 2026-07-24

NOTE: Do not auto-apply. Review SQL, then run `alembic upgrade head` with approval.
Postgres enum ADD VALUE cannot run inside a transaction on older versions;
this migration uses a commit-friendly ALTER.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "003_task_scheduler_job_type"
down_revision: Union[str, None] = "002_job_solutions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ADD VALUE IF NOT EXISTS (PG 9.1+ for ADD VALUE; IF NOT EXISTS needs PG 9.3+/15+)
    op.execute("ALTER TYPE job_type_enum ADD VALUE IF NOT EXISTS 'TASK_SCHEDULER'")


def downgrade() -> None:
    # Postgres cannot remove a single enum value safely; leave as no-op.
    pass
