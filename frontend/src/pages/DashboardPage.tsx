import { Link } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { EmptyState } from "../components/EmptyState";
import { JobStatusBadge } from "../components/JobStatusBadge";
import { JobTypeBadge } from "../components/JobTypeBadge";
import { PageHeader } from "../components/PageHeader";
import {
  ALL_STATUSES,
  ALL_TYPES,
  useDashboardData,
} from "../features/jobs/useDashboardData";
import { formatDateTime } from "../lib/format";
import { ErrorPanel } from "../components/AsyncState";

export function DashboardPage() {
  const state = useDashboardData();

  if (state.status === "loading") {
    return (
      <section className="panel">
        <PageHeader title="Dashboard" subtitle="Loading organization job overview…" />
        <div className="dashboard-grid dashboard-grid--loading">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="stat-card skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="panel">
        <PageHeader title="Dashboard" subtitle="Organization pipeline overview" />
        <ErrorPanel
          title="Dashboard unavailable"
          message={state.message}
          onRetry={() => window.location.reload()}
        />
      </section>
    );
  }

  const { data } = state;

  return (
    <section className="dashboard">
      <PageHeader
        title="Dashboard"
        subtitle="What needs attention across your organization pipelines"
        actions={
          <>
            <Link to="/jobs/templates" className="btn btn--secondary">
              From template
            </Link>
            <Link to="/jobs/new" className="btn btn--primary">
              Create Job
            </Link>
          </>
        }
      />

      <div className="dashboard-grid">
        <article className="stat-card stat-card--highlight">
          <span className="stat-card__label">Total jobs</span>
          <strong className="stat-card__value">{data.totalJobs}</strong>
        </article>
        <article className="stat-card stat-card--alert">
          <span className="stat-card__label">Unresolved problems</span>
          <strong className="stat-card__value">{data.unresolvedProblems}</strong>
        </article>
      </div>

      <div className="dashboard-panels">
        <section className="panel dashboard-panel">
          <h2>By status</h2>
          <div className="chip-grid">
            {ALL_STATUSES.map((status) => (
              <div key={status} className="chip-stat">
                <JobStatusBadge status={status} />
                <span className="chip-stat__count">{data.statusCounts[status]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel dashboard-panel">
          <h2>By pipeline type</h2>
          <div className="chip-grid">
            {ALL_TYPES.map((jobType) => (
              <div key={jobType} className="chip-stat chip-stat--stacked">
                <JobTypeBadge jobType={jobType} />
                <span className="chip-stat__meta">
                  {data.typeCounts[jobType]} job{data.typeCounts[jobType] === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Recently updated jobs</h2>
          <Link to="/jobs" className="dashboard-link">
            View all jobs
          </Link>
        </div>

        {data.recentJobs.length === 0 ? (
          <EmptyState
            title="No jobs yet"
            description="Create your first pipeline job to populate the dashboard."
            action={
              <Link to="/jobs/new" className="btn btn--primary">
                Create Job
              </Link>
            }
          />
        ) : (
          <DataTable
            columns={[
              { key: "name", header: "Job", render: (row) => row.name },
              {
                key: "pipeline",
                header: "Pipeline",
                render: (row) => (
                  <span className="pipeline-cell">
                    <JobTypeBadge jobType={row.job_type} />
                  </span>
                ),
              },
              {
                key: "route",
                header: "Source → Target",
                render: (row) => `${row.source_system} → ${row.target_system}`,
              },
              {
                key: "status",
                header: "Status",
                render: (row) => <JobStatusBadge status={row.status} />,
              },
              {
                key: "updated",
                header: "Updated",
                render: (row) => formatDateTime(row.updated_at),
              },
            ]}
            rows={data.recentJobs}
            rowKey={(row) => row.id}
          />
        )}
      </section>
    </section>
  );
}
