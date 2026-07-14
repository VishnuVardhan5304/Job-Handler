"""Seed 20 jobs into Neon PostgreSQL (idempotent on re-run)."""

from datetime import datetime, timezone

from sqlalchemy import func, select

from app.core.database import SessionLocal
from app.models.job import (
    PIPELINE_DEFAULTS,
    Job,
    JobStatus,
    JobType,
    utc_now,
)

SEED_JOBS: list[dict] = [
    # --- 4 canonical pipeline jobs (one per type) ---
    {
        "name": "Epicor GD Warehouse Sync",
        "job_type": JobType.EPICOR_GD_WH_SYNC,
        "status": JobStatus.ACTIVE,
        "schedule_cron": "0 2 * * *",
        "config": {"batch_size": 5000, "watermark_column": "LastModified"},
    },
    {
        "name": "TXT to RPT Tables Load",
        "job_type": JobType.TXT_TO_RPT,
        "status": JobStatus.ACTIVE,
        "schedule_cron": "0 3 * * *",
        "config": {"source_path": "/incoming/txt", "delimiter": "|"},
    },
    {
        "name": "RPT to Fabric Tables (Data Flow)",
        "job_type": JobType.RPT_TO_FABRIC,
        "status": JobStatus.ACTIVE,
        "schedule_cron": "0 4 * * 1-5",
        "config": {"workspace": "analytics-prod", "dataset": "rpt_mart"},
    },
    {
        "name": "Data Flow to Lake House",
        "job_type": JobType.DATAFLOW_TO_LAKEHOUSE,
        "status": JobStatus.ACTIVE,
        "schedule_cron": "0 5 * * *",
        "config": {"lakehouse": "org-lake", "partition": "daily"},
    },
    # --- 16 additional organization jobs ---
    {
        "name": "Epicor Customer Master Delta",
        "job_type": JobType.EPICOR_GD_WH_SYNC,
        "status": JobStatus.ACTIVE,
        "schedule_cron": "0 */6 * * *",
        "config": {"entity": "Customer", "mode": "delta"},
    },
    {
        "name": "Epicor Part Inventory Nightly",
        "job_type": JobType.EPICOR_GD_WH_SYNC,
        "status": JobStatus.PAUSED,
        "schedule_cron": "0 1 * * *",
        "config": {"entity": "Part", "mode": "full"},
    },
    {
        "name": "TXT Sales Orders Ingest",
        "job_type": JobType.TXT_TO_RPT,
        "status": JobStatus.ACTIVE,
        "config": {"file_pattern": "sales_orders_*.txt"},
    },
    {
        "name": "TXT GL Journal Staging",
        "job_type": JobType.TXT_TO_RPT,
        "status": JobStatus.DRAFT,
        "config": {"file_pattern": "gl_journal_*.txt"},
    },
    {
        "name": "RPT Revenue Mart Refresh",
        "job_type": JobType.RPT_TO_FABRIC,
        "status": JobStatus.ACTIVE,
        "schedule_cron": "30 6 * * *",
        "config": {"table": "fact_revenue"},
    },
    {
        "name": "RPT Inventory Snapshot to Fabric",
        "job_type": JobType.RPT_TO_FABRIC,
        "status": JobStatus.ACTIVE,
        "config": {"table": "fact_inventory_daily"},
    },
    {
        "name": "Lake House Finance Curated Zone",
        "job_type": JobType.DATAFLOW_TO_LAKEHOUSE,
        "status": JobStatus.ACTIVE,
        "config": {"zone": "curated", "domain": "finance"},
    },
    {
        "name": "Lake House Operations Raw Landing",
        "job_type": JobType.DATAFLOW_TO_LAKEHOUSE,
        "status": JobStatus.PAUSED,
        "config": {"zone": "raw", "domain": "operations"},
    },
    {
        "name": "Epicor Shipment History Archive",
        "job_type": JobType.EPICOR_GD_WH_SYNC,
        "status": JobStatus.ARCHIVED,
        "config": {"entity": "ShipHead", "retention_days": 365},
        "archived_at": utc_now(),
    },
    {
        "name": "TXT Vendor Payments Weekly",
        "job_type": JobType.TXT_TO_RPT,
        "status": JobStatus.ACTIVE,
        "schedule_cron": "0 7 * * 1",
        "config": {"file_pattern": "vendor_payments_*.txt"},
    },
    {
        "name": "RPT HR Headcount to Fabric",
        "job_type": JobType.RPT_TO_FABRIC,
        "status": JobStatus.DRAFT,
        "config": {"table": "dim_employee"},
    },
    {
        "name": "Data Flow Quality Metrics Lake",
        "job_type": JobType.DATAFLOW_TO_LAKEHOUSE,
        "status": JobStatus.ACTIVE,
        "config": {"zone": "metrics", "source": "dataflow_monitor"},
    },
    {
        "name": "Epicor BOM Sync Weekend",
        "job_type": JobType.EPICOR_GD_WH_SYNC,
        "status": JobStatus.ACTIVE,
        "schedule_cron": "0 0 * * 6",
        "config": {"entity": "BOM", "mode": "full"},
    },
    {
        "name": "TXT Product Catalog Import",
        "job_type": JobType.TXT_TO_RPT,
        "status": JobStatus.PAUSED,
        "config": {"file_pattern": "product_catalog_*.txt"},
    },
    {
        "name": "RPT Supply Chain KPI Fabric Push",
        "job_type": JobType.RPT_TO_FABRIC,
        "status": JobStatus.ACTIVE,
        "schedule_cron": "0 8 * * *",
        "config": {"table": "kpi_supply_chain"},
    },
    {
        "name": "Legacy TXT Claims Feed (Retired)",
        "job_type": JobType.TXT_TO_RPT,
        "status": JobStatus.ARCHIVED,
        "config": {"note": "Replaced by API feed"},
        "archived_at": utc_now(),
    },
]


def seed() -> None:
    session = SessionLocal()
    try:
        existing = session.scalar(select(Job.id).limit(1))
        if existing is not None:
            count = session.scalar(select(func.count()).select_from(Job))
            print(f"Jobs table already has {count} record(s). Skipping seed.")
            return

        now = datetime.now(timezone.utc)
        for row in SEED_JOBS:
            source, target = PIPELINE_DEFAULTS[row["job_type"]]
            job = Job(
                name=row["name"],
                job_type=row["job_type"],
                source_system=source,
                target_system=target,
                status=row["status"],
                schedule_cron=row.get("schedule_cron"),
                config=row.get("config"),
                created_at=now,
                updated_at=now,
                archived_at=row.get("archived_at"),
            )
            session.add(job)

        session.commit()
        print(f"Seeded {len(SEED_JOBS)} jobs successfully.")
    finally:
        session.close()


if __name__ == "__main__":
    seed()
