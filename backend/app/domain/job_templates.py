"""Organization pipeline job templates — metadata only in MVP."""

from app.models.job import JobType, PIPELINE_DEFAULTS

JOB_TEMPLATES: list[dict] = [
    {
        "id": "epicor-gd-wh-sync",
        "name": "Epicor → GD Warehouse Sync",
        "description": "Synchronize Epicor ERP data into the GD warehouse.",
        "job_type": JobType.EPICOR_GD_WH_SYNC,
        "default_job_name": "Epicor GD Warehouse Sync",
        "schedule_cron": "0 2 * * *",
        "config": {
            "batch_size": 5000,
            "watermark_column": "LastModified",
            "entity": "Part",
            "integration": "simulated",
        },
    },
    {
        "id": "txt-to-rpt",
        "name": "TXT → RPT Tables",
        "description": "Load text/source files into reporting tables.",
        "job_type": JobType.TXT_TO_RPT,
        "default_job_name": "TXT to RPT Tables Load",
        "schedule_cron": "0 3 * * *",
        "config": {
            "source_path": "/incoming/txt",
            "delimiter": "|",
            "file_pattern": "*.txt",
            "integration": "simulated",
        },
    },
    {
        "id": "rpt-to-fabric",
        "name": "RPT → Fabric (Data Flow)",
        "description": "Push reporting mart data into Microsoft Fabric tables.",
        "job_type": JobType.RPT_TO_FABRIC,
        "default_job_name": "RPT to Fabric Tables",
        "schedule_cron": "0 4 * * 1-5",
        "config": {
            "workspace": "analytics-prod",
            "dataset": "rpt_mart",
            "table": "fact_revenue",
            "integration": "simulated",
        },
    },
    {
        "id": "dataflow-to-lakehouse",
        "name": "Data Flow → Lake House",
        "description": "Land data flow output into the organization lake house.",
        "job_type": JobType.DATAFLOW_TO_LAKEHOUSE,
        "default_job_name": "Data Flow to Lake House",
        "schedule_cron": "0 5 * * *",
        "config": {
            "lakehouse": "org-lake",
            "partition": "daily",
            "zone": "curated",
            "integration": "simulated",
        },
    },
    {
        "id": "task-scheduler",
        "name": "Task Scheduler",
        "description": "Import a local Windows Task Scheduler task as a Job (prefer Sync from Jobs list).",
        "job_type": JobType.TASK_SCHEDULER,
        "default_job_name": "Local Task Scheduler Job",
        "schedule_cron": None,
        "config": {
            "integration": "windows_task_scheduler",
            "task_path": "\\",
            "task_name": "",
            "folder": "\\",
            "enabled": True,
        },
    },
]


def enrich_template(raw: dict) -> dict:
    job_type = raw["job_type"]
    source, target = PIPELINE_DEFAULTS[job_type]
    return {
        **raw,
        "job_type": job_type.value,
        "source_system": source,
        "target_system": target,
    }
