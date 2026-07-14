import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJobTemplates } from "../api/jobs";
import { getErrorMessage } from "../api/errors";
import { EmptyState } from "../components/EmptyState";
import { JobTypeBadge } from "../components/JobTypeBadge";
import { PageHeader } from "../components/PageHeader";
import type { JobTemplate } from "../types/template";

export function JobTemplatesPage() {
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchJobTemplates()
      .then((data) => {
        if (!active) return;
        setTemplates(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(getErrorMessage(err, "Could not load templates"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="job-templates">
      <PageHeader
        title="Create from template"
        subtitle="Start with a preset for your organization’s four core pipelines"
        actions={
          <Link to="/jobs/new" className="btn btn--secondary">
            Blank job form
          </Link>
        }
      />

      <p className="muted template-note">
        Templates set job type, source → target, schedule, and config metadata. Connectors to
        Epicor, Fabric, and Lake House are <strong>simulated in MVP</strong> — no live integration
        yet.
      </p>

      {loading ? (
        <div className="template-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="template-card skeleton" />
          ))}
        </div>
      ) : null}

      {error ? (
        <EmptyState title="Templates unavailable" description={error} />
      ) : null}

      {!loading && !error ? (
        <div className="template-grid">
          {templates.map((template) => (
            <article key={template.id} className="template-card panel">
              <div className="template-card__head">
                <JobTypeBadge jobType={template.job_type} />
                <span className="template-card__mode">{template.integration_mode}</span>
              </div>
              <h2>{template.name}</h2>
              <p>{template.description}</p>
              <p className="template-card__route">
                {template.source_system} → {template.target_system}
              </p>
              {template.schedule_cron ? (
                <p className="muted template-card__cron">Schedule: {template.schedule_cron}</p>
              ) : null}
              <Link
                to={`/jobs/new?template=${template.id}`}
                className="btn btn--primary template-card__cta"
              >
                Use template
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
