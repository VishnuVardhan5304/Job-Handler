import { type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { useToast } from "../components/Toast";
import { useEditJobForm } from "../features/jobs/useEditJobForm";
import type { JobStatus, JobType } from "../types/api";

export function EditJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { showToast } = useToast();
  const {
    loadState,
    values,
    errors,
    submitting,
    archiving,
    archiveOpen,
    setArchiveOpen,
    setField,
    onJobTypeChange,
    submit,
    confirmArchive,
    navigate,
    isArchived,
    labels,
  } = useEditJobForm(jobId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    const result = await submit(event);
    if (result?.ok) {
      showToast("Job updated successfully", "success");
      navigate(`/jobs/${jobId}`);
    } else if (result?.ok === false) {
      showToast("Could not save job — check the form for details.", "error");
    }
  };

  const handleArchive = async () => {
    const result = await confirmArchive();
    if (result?.ok) {
      showToast("Job archived", "success");
      navigate("/jobs");
    } else {
      showToast("Could not archive job — check the form for details.", "error");
    }
  };

  if (loadState.status === "loading") {
    return (
      <section className="panel">
        <PageHeader title="Edit Job" subtitle="Loading job details…" />
        <div className="skeleton jobs-list__skeleton-row" />
      </section>
    );
  }

  if (loadState.status === "error") {
    return (
      <section className="panel">
        <PageHeader title="Edit Job" />
        <EmptyState
          title="Job not found"
          description={loadState.message}
          action={
            <Link to="/jobs" className="btn btn--secondary">
              Back to jobs
            </Link>
          }
        />
      </section>
    );
  }

  if (!values) return null;

  return (
    <section className="edit-job">
      <PageHeader
        title="Edit Job"
        subtitle={loadState.job.name}
        actions={
          <Link to={`/jobs/${jobId}`} className="btn btn--secondary">
            Cancel
          </Link>
        }
      />

      {isArchived ? (
        <div className="panel">
          <EmptyState
            title="This job is archived"
            description="Archived jobs cannot be edited. You can still view the record from the jobs list with archived filter enabled."
            action={
              <Link to="/jobs?include_archived=true" className="btn btn--secondary">
                View archived jobs
              </Link>
            }
          />
        </div>
      ) : (
        <form className="panel create-job__form" onSubmit={handleSubmit} noValidate>
          {errors.form ? <p className="form-banner form-banner--error">{errors.form}</p> : null}

          <FormField label="Job name" htmlFor="edit-job-name" error={errors.name}>
            <input
              id="edit-job-name"
              className="input"
              value={values.name}
              onChange={(event) => setField("name", event.target.value)}
              maxLength={255}
              required
            />
          </FormField>

          <FormField
            label="Pipeline type"
            htmlFor="edit-job-type"
            error={errors.job_type}
            hint="Changing type resets source and target defaults"
          >
            <select
              id="edit-job-type"
              className="select"
              value={values.job_type}
              onChange={(event) => onJobTypeChange(event.target.value as JobType)}
            >
              {(Object.keys(labels.jobType) as JobType[]).map((jobType) => (
                <option key={jobType} value={jobType}>
                  {labels.jobType[jobType]}
                </option>
              ))}
            </select>
          </FormField>

          <div className="form-grid">
            <FormField label="Source system" htmlFor="edit-source-system" error={errors.source_system}>
              <input
                id="edit-source-system"
                className="input"
                value={values.source_system}
                onChange={(event) => setField("source_system", event.target.value)}
                required
              />
            </FormField>

            <FormField label="Target system" htmlFor="edit-target-system" error={errors.target_system}>
              <input
                id="edit-target-system"
                className="input"
                value={values.target_system}
                onChange={(event) => setField("target_system", event.target.value)}
                required
              />
            </FormField>
          </div>

          <div className="form-grid">
            <FormField label="Status" htmlFor="edit-job-status" error={errors.status}>
              <select
                id="edit-job-status"
                className="select"
                value={values.status}
                onChange={(event) => setField("status", event.target.value as JobStatus)}
              >
                {(Object.keys(labels.jobStatus) as JobStatus[])
                  .filter((status) => status !== "archived")
                  .map((status) => (
                    <option key={status} value={status}>
                      {labels.jobStatus[status]}
                    </option>
                  ))}
              </select>
            </FormField>

            <FormField
              label="Schedule (cron)"
              htmlFor="edit-schedule-cron"
              error={errors.schedule_cron}
              hint="Optional"
            >
              <input
                id="edit-schedule-cron"
                className="input"
                value={values.schedule_cron}
                onChange={(event) => setField("schedule_cron", event.target.value)}
                placeholder="0 2 * * *"
                maxLength={64}
              />
            </FormField>
          </div>

          <div className="form-actions form-actions--split">
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => setArchiveOpen(true)}
              disabled={submitting || archiving}
            >
              Archive job
            </button>
            <div className="form-actions__right">
              <Link to={`/jobs/${jobId}`} className="btn btn--secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn--primary" disabled={submitting || archiving}>
                {submitting ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      )}

      <Modal
        open={archiveOpen}
        title="Archive this job?"
        onClose={() => setArchiveOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setArchiveOpen(false)}
              disabled={archiving}
            >
              Cancel
            </button>
            <button type="button" className="btn btn--danger" onClick={handleArchive} disabled={archiving}>
              {archiving ? "Archiving…" : "Archive"}
            </button>
          </>
        }
      >
        <p>
          <strong>{loadState.job.name}</strong> will be hidden from the default jobs list. Problems
          and history are kept.
        </p>
      </Modal>
    </section>
  );
}
