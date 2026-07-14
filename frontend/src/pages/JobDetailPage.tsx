import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchJob } from "../api/jobs";
import { DataTable } from "../components/DataTable";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { JobStatusBadge } from "../components/JobStatusBadge";
import { JobTypeBadge } from "../components/JobTypeBadge";
import { PageHeader } from "../components/PageHeader";
import { RunStatusBadge } from "../components/RunStatusBadge";
import { SeverityBadge } from "../components/SeverityBadge";
import { useToast } from "../components/Toast";
import { useJobProblems } from "../features/problems/useJobProblems";
import { useJobRuns } from "../features/runs/useJobRuns";
import { SEVERITY_LABELS } from "../lib/labels";
import type { Job, ProblemSeverity } from "../types/api";
import { getErrorMessage } from "../api/errors";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { showToast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);

  const {
    state: runsState,
    simulating,
    simulate,
  } = useJobRuns(jobId);

  const {
    state: problemsState,
    form,
    formErrors,
    submitting,
    resolvingId,
    setField,
    submitProblem,
    resolve,
    prefillProblem,
  } = useJobProblems(jobId, unresolvedOnly);

  useEffect(() => {
    if (!jobId) {
      setJobError("Missing job id");
      setJobLoading(false);
      return;
    }

    let active = true;
    fetchJob(jobId)
      .then((data) => {
        if (!active) return;
        setJob(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setJobError(getErrorMessage(err, "Could not load job"));
      })
      .finally(() => {
        if (active) setJobLoading(false);
      });

    return () => {
      active = false;
    };
  }, [jobId]);

  const handleAddProblem = async (event: FormEvent<HTMLFormElement>) => {
    const result = await submitProblem(event);
    if (result?.ok) showToast("Problem logged", "success");
  };

  const handleResolve = async (problemId: string) => {
    const result = await resolve(problemId);
    if (result?.ok) {
      showToast("Problem resolved", "success");
    } else if (result && !result.ok) {
      showToast(result.message ?? "Could not resolve problem", "error");
    }
  };

  const handleSimulateRun = async (archived: boolean) => {
    const result = await simulate();
    if (result?.ok) {
      if (result.run.status === "succeeded") {
        showToast("Simulated run completed successfully", "success");
      } else {
        showToast("Simulated run failed", "error");
        if (!archived) {
          prefillProblem({
            severity: "high",
            code: "RUN_FAILED",
            message: result.run.message ?? "Simulated pipeline run failed",
          });
        }
      }
    } else if (result && !result.ok) {
      showToast(result.message ?? "Could not simulate run", "error");
    }
  };

  if (jobLoading) {
    return (
      <section className="panel">
        <PageHeader title="Job detail" subtitle="Loading…" />
        <div className="skeleton jobs-list__skeleton-row" />
      </section>
    );
  }

  if (jobError || !job) {
    return (
      <section className="panel">
        <PageHeader title="Job detail" />
        <EmptyState
          title="Job not found"
          description={jobError ?? "Unknown error"}
          action={
            <Link to="/jobs" className="btn btn--secondary">
              Back to jobs
            </Link>
          }
        />
      </section>
    );
  }

  const isArchived = job.archived_at !== null || job.status === "archived";

  return (
    <section className="job-detail">
      <PageHeader
        title={job.name}
        subtitle={`${job.source_system} → ${job.target_system}`}
        actions={
          <>
            {!isArchived ? (
              <Link to={`/jobs/${job.id}/edit`} className="btn btn--secondary">
                Edit
              </Link>
            ) : null}
            <Link to="/jobs" className="btn btn--secondary">
              Back to list
            </Link>
          </>
        }
      />

      <section className="panel job-detail__summary">
        <div className="job-detail__badges">
          <JobTypeBadge jobType={job.job_type} />
          <JobStatusBadge status={job.status} />
        </div>
        {job.schedule_cron ? (
          <p className="muted">Schedule: {job.schedule_cron}</p>
        ) : null}
      </section>

      <section className="panel job-detail__runs">
        <div className="job-detail__section-header">
          <div>
            <h2>Runs</h2>
            <p className="muted job-detail__runs-note">
              Simulated execution history — no live Epicor, Fabric, or Lake House connectors in MVP.
            </p>
          </div>
          {!isArchived ? (
            <button
              type="button"
              className="btn btn--primary"
              disabled={simulating}
              onClick={() => handleSimulateRun(isArchived)}
            >
              {simulating ? "Simulating…" : "Simulate run"}
            </button>
          ) : null}
        </div>

        {runsState.status === "loading" ? (
          <div className="jobs-list__loading">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton jobs-list__skeleton-row" />
            ))}
          </div>
        ) : null}

        {runsState.status === "error" ? (
          <EmptyState title="Could not load runs" description={runsState.message} />
        ) : null}

        {runsState.status === "ready" && runsState.items.length === 0 ? (
          <EmptyState
            title="No runs yet"
            description="Trigger a simulated run to see status and timeline for this job."
          />
        ) : null}

        {runsState.status === "ready" && runsState.items.length > 0 ? (
          <DataTable
            columns={[
              {
                key: "status",
                header: "Status",
                render: (row) => <RunStatusBadge status={row.status} />,
              },
              {
                key: "started",
                header: "Started",
                render: (row) => formatWhen(row.started_at),
              },
              {
                key: "finished",
                header: "Finished",
                render: (row) => (row.finished_at ? formatWhen(row.finished_at) : "—"),
              },
              {
                key: "message",
                header: "Message",
                render: (row) => row.message ?? "—",
              },
              {
                key: "actions",
                header: "",
                className: "data-table__actions",
                render: (row) =>
                  row.status === "failed" && !isArchived ? (
                    <button
                      type="button"
                      className="btn btn--secondary btn--small"
                      onClick={() =>
                        prefillProblem({
                          severity: "high",
                          code: "RUN_FAILED",
                          message: row.message ?? "Simulated pipeline run failed",
                        })
                      }
                    >
                      Log problem
                    </button>
                  ) : null,
              },
            ]}
            rows={runsState.items}
            rowKey={(row) => row.id}
          />
        ) : null}
      </section>

      <section className="panel job-detail__problems">
        <div className="job-detail__problems-header">
          <h2>Problems</h2>
          <label className="filter-field filter-field--checkbox">
            <input
              type="checkbox"
              checked={unresolvedOnly}
              onChange={(event) => setUnresolvedOnly(event.target.checked)}
            />
            <span>Unresolved only</span>
          </label>
        </div>

        {!isArchived ? (
          <form className="add-problem-form" onSubmit={handleAddProblem} noValidate>
            <h3>Log a problem</h3>
            {formErrors.form ? <p className="form-banner form-banner--error">{formErrors.form}</p> : null}
            <div className="form-grid">
              <FormField label="Severity" htmlFor="problem-severity" error={formErrors.severity}>
                <select
                  id="problem-severity"
                  className="select"
                  value={form.severity}
                  onChange={(event) => setField("severity", event.target.value as ProblemSeverity)}
                >
                  {(Object.keys(SEVERITY_LABELS) as ProblemSeverity[]).map((severity) => (
                    <option key={severity} value={severity}>
                      {SEVERITY_LABELS[severity]}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Code" htmlFor="problem-code" error={formErrors.code}>
                <input
                  id="problem-code"
                  className="input"
                  value={form.code}
                  onChange={(event) => setField("code", event.target.value)}
                  placeholder="SYNC_TIMEOUT"
                  maxLength={64}
                />
              </FormField>
            </div>
            <FormField label="Message" htmlFor="problem-message" error={formErrors.message}>
              <textarea
                id="problem-message"
                className="textarea"
                rows={3}
                value={form.message}
                onChange={(event) => setField("message", event.target.value)}
                placeholder="Describe what went wrong…"
              />
            </FormField>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? "Saving…" : "Add problem"}
              </button>
            </div>
          </form>
        ) : (
          <p className="muted">Archived jobs cannot accept new problems.</p>
        )}

        {problemsState.status === "loading" ? (
          <div className="jobs-list__loading">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton jobs-list__skeleton-row" />
            ))}
          </div>
        ) : null}

        {problemsState.status === "error" ? (
          <EmptyState title="Could not load problems" description={problemsState.message} />
        ) : null}

        {problemsState.status === "ready" && problemsState.items.length === 0 ? (
          <EmptyState
            title={unresolvedOnly ? "No open problems" : "No problems recorded"}
            description={
              unresolvedOnly
                ? "This job has no unresolved problems right now."
                : "Log a problem when something goes wrong during a pipeline run."
            }
          />
        ) : null}

        {problemsState.status === "ready" && problemsState.items.length > 0 ? (
          <DataTable
            columns={[
              {
                key: "severity",
                header: "Severity",
                render: (row) => <SeverityBadge severity={row.severity} />,
              },
              { key: "code", header: "Code", render: (row) => row.code },
              { key: "message", header: "Message", render: (row) => row.message },
              {
                key: "occurred",
                header: "Occurred",
                render: (row) => formatWhen(row.occurred_at),
              },
              {
                key: "resolved",
                header: "Resolved",
                render: (row) => (row.resolved_at ? formatWhen(row.resolved_at) : "—"),
              },
              {
                key: "actions",
                header: "",
                className: "data-table__actions",
                render: (row) =>
                  row.resolved_at ? null : (
                    <button
                      type="button"
                      className="btn btn--secondary btn--small"
                      disabled={resolvingId === row.id}
                      onClick={() => handleResolve(row.id)}
                    >
                      {resolvingId === row.id ? "Resolving…" : "Resolve"}
                    </button>
                  ),
              },
            ]}
            rows={problemsState.items}
            rowKey={(row) => row.id}
          />
        ) : null}
      </section>
    </section>
  );
}
