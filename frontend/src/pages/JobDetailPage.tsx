import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchJob } from "../api/jobs";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { JobStatusBadge } from "../components/JobStatusBadge";
import { JobTypeBadge } from "../components/JobTypeBadge";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { RunStatusBadge } from "../components/RunStatusBadge";
import { ProblemStatusBadge } from "../components/ProblemStatusBadge";
import { SeverityBadge } from "../components/SeverityBadge";
import { useToast } from "../components/Toast";
import { useJobProblems } from "../features/problems/useJobProblems";
import { useJobRuns } from "../features/runs/useJobRuns";
import { useJobSolutions } from "../features/solutions/useJobSolutions";
import { SEVERITY_LABELS } from "../lib/labels";
import { formatDateTime } from "../lib/format";
import type { Job, JobProblem, JobSolution, ProblemSeverity } from "../types/api";
import { getErrorMessage } from "../api/errors";

const TABLE_PREVIEW_LIMIT = 5;

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { showToast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [problemsModalOpen, setProblemsModalOpen] = useState(false);
  const [solutionsModalOpen, setSolutionsModalOpen] = useState(false);

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
    reload: reloadProblems,
  } = useJobProblems(jobId, unresolvedOnly);

  const {
    state: solutionsState,
    form: solutionForm,
    formErrors: solutionErrors,
    submitting: solutionSubmitting,
    setField: setSolutionField,
    selectProblem,
    submitSolution,
    reload: reloadSolutions,
  } = useJobSolutions(jobId, null);

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
      setUnresolvedOnly(false);
      showToast("Problem closed", "success");
      await reloadSolutions();
    } else if (result && !result.ok) {
      showToast(result.message ?? "Could not close problem", "error");
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

  const goToSolutionsForProblem = (problemId: string) => {
    setSelectedProblemId(problemId);
    selectProblem(problemId);
    window.requestAnimationFrame(() => {
      document.getElementById("job-solutions")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleAddSolution = async (event: FormEvent<HTMLFormElement>) => {
    const result = await submitSolution(event);
    if (result?.ok) {
      showToast("Solution saved — you can Close the problem now", "success");
      await reloadProblems();
      await reloadSolutions();
    }
  };

  const problemIdsWithSolution = new Set(
    solutionsState.status === "ready"
      ? solutionsState.items.map((item) => item.job_problem_id)
      : [],
  );

  const visibleSolutions =
    solutionsState.status === "ready"
      ? selectedProblemId
        ? solutionsState.items.filter((item) => item.job_problem_id === selectedProblemId)
        : solutionsState.items
      : [];

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

  const allProblems = problemsState.status === "ready" ? problemsState.items : [];
  const previewProblems = allProblems.slice(0, TABLE_PREVIEW_LIMIT);
  const allSolutionsForView = visibleSolutions;
  const previewSolutions = allSolutionsForView.slice(0, TABLE_PREVIEW_LIMIT);

  const problemColumns: DataTableColumn<JobProblem>[] = [
    {
      key: "id",
      header: "Problem ID",
      render: (row) => (
        <button
          type="button"
          className="table-link table-link--mono"
          title="Go to solutions for this problem"
          onClick={() => {
            setProblemsModalOpen(false);
            goToSolutionsForProblem(row.id);
          }}
        >
          {row.id}
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <ProblemStatusBadge status={row.status} />,
    },
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
      render: (row) =>
        formatDateTime(row.status === "closed" && row.resolved_at ? row.resolved_at : row.occurred_at),
    },
    {
      key: "actions",
      header: "",
      className: "data-table__actions",
      render: (row) => {
        if (row.status !== "open") return null;
        const hasSolution = problemIdsWithSolution.has(row.id);
        return (
          <button
            type="button"
            className="btn btn--secondary btn--small"
            disabled={!hasSolution || resolvingId === row.id}
            title={
              hasSolution
                ? "Close this problem"
                : "Add a solution for this problem before closing"
            }
            onClick={() => {
              if (!hasSolution) {
                setProblemsModalOpen(false);
                goToSolutionsForProblem(row.id);
                showToast("Add a solution first, then Close", "error");
                return;
              }
              void handleResolve(row.id);
            }}
          >
            {resolvingId === row.id ? "Closing…" : "Close"}
          </button>
        );
      },
    },
  ];

  const solutionColumns: DataTableColumn<JobSolution>[] = [
    {
      key: "id",
      header: "Solution ID",
      render: (row) => <span className="mono-id">{row.id}</span>,
    },
    {
      key: "problem",
      header: "Problem ID",
      render: (row) => (
        <button
          type="button"
          className="table-link table-link--mono"
          onClick={() => {
            setSolutionsModalOpen(false);
            goToSolutionsForProblem(row.job_problem_id);
          }}
        >
          {row.job_problem_id}
        </button>
      ),
    },
    { key: "summary", header: "Summary", render: (row) => row.summary },
    { key: "details", header: "Details", render: (row) => row.details },
    {
      key: "created",
      header: "Created",
      render: (row) => formatDateTime(row.created_at),
    },
  ];

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
        {job.job_type === "TASK_SCHEDULER" && job.config ? (
          <dl className="job-detail__meta">
            {typeof job.config.task_path === "string" ? (
              <>
                <dt>Task path</dt>
                <dd className="mono-id">{job.config.task_path}</dd>
              </>
            ) : null}
            {typeof job.config.folder === "string" ? (
              <>
                <dt>Folder</dt>
                <dd>{job.config.folder}</dd>
              </>
            ) : null}
            {typeof job.config.state === "string" ? (
              <>
                <dt>Scheduler state</dt>
                <dd>{job.config.state}</dd>
              </>
            ) : null}
            {typeof job.config.enabled === "boolean" ? (
              <>
                <dt>Enabled</dt>
                <dd>{job.config.enabled ? "Yes" : "No"}</dd>
              </>
            ) : null}
            {job.config.last_run_time != null ? (
              <>
                <dt>Last run</dt>
                <dd>{String(job.config.last_run_time)}</dd>
              </>
            ) : null}
            {job.config.last_task_result != null ? (
              <>
                <dt>Last result</dt>
                <dd>{String(job.config.last_task_result)}</dd>
              </>
            ) : null}
          </dl>
        ) : null}
      </section>

      <section className="panel job-detail__runs">
        <div className="job-detail__section-header">
          <div>
            <h2>Runs</h2>
            <p className="muted job-detail__runs-note">
              {job.job_type === "TASK_SCHEDULER"
                ? "Runs are imported from local Task Scheduler on Sync. Simulate remains available for manual checks."
                : "Simulated execution history — no live Epicor, Fabric, or Lake House connectors in MVP."}
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
                render: (row) => formatDateTime(row.started_at),
              },
              {
                key: "finished",
                header: "Finished",
                render: (row) => (row.finished_at ? formatDateTime(row.finished_at) : "—"),
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
          <div className="job-detail__header-actions">
            <label className="filter-field filter-field--checkbox">
              <input
                type="checkbox"
                checked={unresolvedOnly}
                onChange={(event) => setUnresolvedOnly(event.target.checked)}
              />
              <span>Open only</span>
            </label>
            {allProblems.length > TABLE_PREVIEW_LIMIT ? (
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => setProblemsModalOpen(true)}
              >
                View all ({allProblems.length})
              </button>
            ) : null}
          </div>
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
                ? "This job has no open problems right now."
                : "Log a problem when something goes wrong during a pipeline run."
            }
          />
        ) : null}

        {problemsState.status === "ready" && allProblems.length > 0 ? (
          <DataTable
            columns={problemColumns}
            rows={previewProblems}
            rowKey={(row) => row.id}
          />
        ) : null}
      </section>

      <section id="job-solutions" className="panel job-detail__solutions">
        <div className="job-detail__section-header">
          <div>
            <h2>Solutions</h2>
            <p className="muted job-detail__runs-note">
              Click a Problem ID above to focus this section. Save a solution first — then{" "}
              <strong>Close</strong> becomes available for that problem.
            </p>
          </div>
          <div className="job-detail__header-actions">
            {selectedProblemId ? (
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => setSelectedProblemId(null)}
              >
                Show all solutions
              </button>
            ) : null}
            {allSolutionsForView.length > TABLE_PREVIEW_LIMIT ? (
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => setSolutionsModalOpen(true)}
              >
                View all ({allSolutionsForView.length})
              </button>
            ) : null}
          </div>
        </div>

        {selectedProblemId ? (
          <p className="muted">
            Focused problem: <code className="mono-id">{selectedProblemId}</code>
          </p>
        ) : null}

        {!isArchived ? (
          <form className="add-problem-form" onSubmit={handleAddSolution} noValidate>
            <h3>Add a solution</h3>
            {solutionErrors.form ? (
              <p className="form-banner form-banner--error">{solutionErrors.form}</p>
            ) : null}
            <FormField
              label="Problem"
              htmlFor="solution-problem"
              error={solutionErrors.job_problem_id}
              hint="Pick an open problem, or click its Problem ID in the table above"
            >
              <select
                id="solution-problem"
                className="select"
                value={solutionForm.job_problem_id}
                onChange={(event) => {
                  setSolutionField("job_problem_id", event.target.value);
                  setSelectedProblemId(event.target.value || null);
                }}
              >
                <option value="">Select a problem…</option>
                {problemsState.status === "ready"
                  ? problemsState.items
                      .filter((problem) => problem.status === "open" || problem.id === solutionForm.job_problem_id)
                      .map((problem) => (
                      <option key={problem.id} value={problem.id}>
                        [{problem.status}] {problem.code} — {problem.id.slice(0, 8)}…
                      </option>
                    ))
                  : null}
              </select>
            </FormField>
            <FormField label="Summary" htmlFor="solution-summary" error={solutionErrors.summary}>
              <input
                id="solution-summary"
                className="input"
                value={solutionForm.summary}
                onChange={(event) => setSolutionField("summary", event.target.value)}
                placeholder="e.g. Increased watermark batch size"
                maxLength={255}
              />
            </FormField>
            <FormField label="Details" htmlFor="solution-details" error={solutionErrors.details}>
              <textarea
                id="solution-details"
                className="textarea"
                rows={4}
                value={solutionForm.details}
                onChange={(event) => setSolutionField("details", event.target.value)}
                placeholder="Describe how the problem was addressed…"
              />
            </FormField>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={solutionSubmitting}>
                {solutionSubmitting ? "Saving…" : "Save solution"}
              </button>
            </div>
          </form>
        ) : (
          <p className="muted">Archived jobs cannot accept new solutions.</p>
        )}

        {solutionsState.status === "loading" ? (
          <div className="jobs-list__loading">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="skeleton jobs-list__skeleton-row" />
            ))}
          </div>
        ) : null}

        {solutionsState.status === "error" ? (
          <EmptyState title="Could not load solutions" description={solutionsState.message} />
        ) : null}

        {solutionsState.status === "ready" && allSolutionsForView.length === 0 ? (
          <EmptyState
            title="No solutions yet"
            description="Add a solution for a problem, then use Close on that problem to mark it closed."
          />
        ) : null}

        {solutionsState.status === "ready" && allSolutionsForView.length > 0 ? (
          <DataTable
            columns={solutionColumns}
            rows={previewSolutions}
            rowKey={(row) => row.id}
          />
        ) : null}
      </section>

      <Modal
        open={problemsModalOpen}
        title={`All problems (${allProblems.length})`}
        onClose={() => setProblemsModalOpen(false)}
        wide
        footer={
          <button type="button" className="btn btn--secondary" onClick={() => setProblemsModalOpen(false)}>
            Close
          </button>
        }
      >
        <div className="scroll-panel">
          <DataTable columns={problemColumns} rows={allProblems} rowKey={(row) => row.id} />
        </div>
      </Modal>

      <Modal
        open={solutionsModalOpen}
        title={`All solutions (${allSolutionsForView.length})`}
        onClose={() => setSolutionsModalOpen(false)}
        wide
        footer={
          <button type="button" className="btn btn--secondary" onClick={() => setSolutionsModalOpen(false)}>
            Close
          </button>
        }
      >
        <div className="scroll-panel">
          <DataTable columns={solutionColumns} rows={allSolutionsForView} rowKey={(row) => row.id} />
        </div>
      </Modal>
    </section>
  );
}
