import { type FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchJobTemplates } from "../api/jobs";
import { FormField } from "../components/FormField";
import { JobTypeBadge } from "../components/JobTypeBadge";
import { PageHeader } from "../components/PageHeader";
import { useToast } from "../components/Toast";
import { useCreateJobForm } from "../features/jobs/useCreateJobForm";
import type { JobTemplate } from "../types/template";
import type { JobStatus, JobType } from "../types/api";

export function CreateJobPage() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const [resolvedTemplate, setResolvedTemplate] = useState<JobTemplate | null | undefined>(
    templateId ? undefined : null,
  );

  useEffect(() => {
    if (!templateId) {
      setResolvedTemplate(null);
      return;
    }
    let active = true;
    fetchJobTemplates()
      .then((templates) => {
        if (!active) return;
        setResolvedTemplate(templates.find((item) => item.id === templateId) ?? null);
      })
      .catch(() => {
        if (!active) return;
        setResolvedTemplate(null);
      });
    return () => {
      active = false;
    };
  }, [templateId]);

  const { values, errors, submitting, setField, onJobTypeChange, submit, navigate, labels } =
    useCreateJobForm(resolvedTemplate ?? null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    const result = await submit(event);
    if (result?.ok) {
      showToast("Job created successfully", "success");
      navigate(`/jobs/${result.jobId}`);
    }
  };

  if (templateId && resolvedTemplate === undefined) {
    return (
      <section className="panel">
        <PageHeader title="Create Job" subtitle="Loading template…" />
        <div className="skeleton jobs-list__skeleton-row" />
      </section>
    );
  }

  return (
    <section className="create-job">
      <PageHeader
        title="Create Job"
        subtitle={
          resolvedTemplate
            ? `From template: ${resolvedTemplate.name}`
            : "Register a new organization pipeline job"
        }
        actions={
          <>
            <Link to="/jobs/templates" className="btn btn--secondary">
              Templates
            </Link>
            <Link to="/jobs" className="btn btn--secondary">
              Cancel
            </Link>
          </>
        }
      />

      {resolvedTemplate ? (
        <div className="panel template-applied-banner">
          <JobTypeBadge jobType={resolvedTemplate.job_type} />
          <span className="muted">
            Config metadata will be saved with the job. Integration mode:{" "}
            <strong>{resolvedTemplate.integration_mode}</strong> (no live connector in MVP).
          </span>
        </div>
      ) : null}

      <form className="panel create-job__form" onSubmit={handleSubmit} noValidate>
        {errors.form ? <p className="form-banner form-banner--error">{errors.form}</p> : null}

        <FormField label="Job name" htmlFor="job-name" error={errors.name}>
          <input
            id="job-name"
            className="input"
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
            placeholder="e.g. Nightly TXT to RPT Load"
            maxLength={255}
            required
          />
        </FormField>

        <FormField
          label="Pipeline type"
          htmlFor="job-type"
          error={errors.job_type}
          hint="Selecting a type auto-fills source and target"
        >
          <select
            id="job-type"
            className="select"
            value={values.job_type}
            onChange={(event) => onJobTypeChange(event.target.value as JobType)}
            required
          >
            {(Object.keys(labels.jobType) as JobType[]).map((jobType) => (
              <option key={jobType} value={jobType}>
                {labels.jobType[jobType]}
              </option>
            ))}
          </select>
        </FormField>

        <div className="form-grid">
          <FormField label="Source system" htmlFor="source-system" error={errors.source_system}>
            <input
              id="source-system"
              className="input"
              value={values.source_system}
              onChange={(event) => setField("source_system", event.target.value)}
              required
            />
          </FormField>

          <FormField label="Target system" htmlFor="target-system" error={errors.target_system}>
            <input
              id="target-system"
              className="input"
              value={values.target_system}
              onChange={(event) => setField("target_system", event.target.value)}
              required
            />
          </FormField>
        </div>

        <div className="form-grid">
          <FormField label="Status" htmlFor="job-status" error={errors.status}>
            <select
              id="job-status"
              className="select"
              value={values.status}
              onChange={(event) => setField("status", event.target.value as JobStatus)}
            >
              {(Object.keys(labels.jobStatus) as JobStatus[]).map((status) => (
                <option key={status} value={status}>
                  {labels.jobStatus[status]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Schedule (cron)"
            htmlFor="schedule-cron"
            error={errors.schedule_cron}
            hint="Optional — metadata only in MVP"
          >
            <input
              id="schedule-cron"
              className="input"
              value={values.schedule_cron}
              onChange={(event) => setField("schedule_cron", event.target.value)}
              placeholder="0 2 * * *"
              maxLength={64}
            />
          </FormField>
        </div>

        {values.config ? (
          <FormField label="Template config (read-only)" htmlFor="template-config">
            <textarea
              id="template-config"
              className="textarea"
              rows={4}
              readOnly
              value={JSON.stringify(values.config, null, 2)}
            />
          </FormField>
        ) : null}

        <div className="form-actions">
          <Link to="/jobs" className="btn btn--secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create Job"}
          </button>
        </div>
      </form>
    </section>
  );
}
