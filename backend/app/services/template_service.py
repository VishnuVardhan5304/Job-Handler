from app.domain.job_templates import JOB_TEMPLATES, enrich_template
from app.schemas.template import JobTemplateRead


def list_job_templates() -> list[JobTemplateRead]:
    items: list[JobTemplateRead] = []
    for raw in JOB_TEMPLATES:
        data = enrich_template(raw)
        config = dict(data.get("config") or {})
        integration_mode = config.pop("integration", "simulated")
        items.append(
            JobTemplateRead(
                id=data["id"],
                name=data["name"],
                description=data["description"],
                job_type=data["job_type"],
                source_system=data["source_system"],
                target_system=data["target_system"],
                default_job_name=data["default_job_name"],
                schedule_cron=data.get("schedule_cron"),
                config=config,
                integration_mode=integration_mode,
            )
        )
    return items


def get_job_template(template_id: str) -> JobTemplateRead | None:
    for template in list_job_templates():
        if template.id == template_id:
            return template
    return None
