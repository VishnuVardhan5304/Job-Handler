import { Link } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { EmptyState } from "../components/EmptyState";
import { ErrorPanel, LoadingBlock } from "../components/AsyncState";
import { JobStatusBadge } from "../components/JobStatusBadge";
import { JobTypeBadge } from "../components/JobTypeBadge";
import { PageHeader } from "../components/PageHeader";
import {
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  useJobsList,
} from "../features/jobs/useJobsList";
import { formatDateTime } from "../lib/format";
import type { JobStatus, JobType } from "../types/api";

export function JobsListPage() {
  const { state, searchInput, setSearchInput, filters, updateParams, goToJob } = useJobsList();

  const hasActiveFilters = Boolean(
    filters.search || filters.job_type || filters.status || filters.include_archived,
  );

  return (
    <section className="jobs-list">
      <PageHeader
        title="Jobs"
        subtitle="Browse, search, and filter organization pipeline jobs"
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

      <section className="panel jobs-list__filters">
        <div className="filters-grid">
          <label className="filter-field filter-field--wide">
            <span>Search</span>
            <input
              className="input"
              type="search"
              placeholder="Search by job name…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>

          <label className="filter-field">
            <span>Pipeline type</span>
            <select
              className="select"
              value={filters.job_type ?? ""}
              onChange={(event) =>
                updateParams({
                  job_type: event.target.value || null,
                  page: "1",
                })
              }
            >
              <option value="">All types</option>
              {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((jobType) => (
                <option key={jobType} value={jobType}>
                  {JOB_TYPE_LABELS[jobType]}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Status</span>
            <select
              className="select"
              value={filters.status ?? ""}
              onChange={(event) =>
                updateParams({
                  status: event.target.value || null,
                  page: "1",
                })
              }
            >
              <option value="">All statuses</option>
              {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((jobStatus) => (
                <option key={jobStatus} value={jobStatus}>
                  {JOB_STATUS_LABELS[jobStatus]}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Sort by</span>
            <select
              className="select"
              value={filters.sort_by ?? "updated_at"}
              onChange={(event) =>
                updateParams({
                  sort_by: event.target.value,
                  page: "1",
                })
              }
            >
              <option value="updated_at">Last updated</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="created_at">Created</option>
            </select>
          </label>

          <label className="filter-field">
            <span>Order</span>
            <select
              className="select"
              value={filters.sort_order ?? "desc"}
              onChange={(event) =>
                updateParams({
                  sort_order: event.target.value,
                  page: "1",
                })
              }
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>

          <label className="filter-field filter-field--checkbox">
            <input
              type="checkbox"
              checked={filters.include_archived ?? false}
              onChange={(event) =>
                updateParams({
                  include_archived: event.target.checked ? "true" : null,
                  page: "1",
                })
              }
            />
            <span>Include archived</span>
          </label>
        </div>
      </section>

      <section className="panel jobs-list__results">
        {state.status === "loading" ? (
          <LoadingBlock label="Loading jobs…" rows={5} />
        ) : null}

        {state.status === "error" ? (
          <ErrorPanel
            title="Could not load jobs"
            message={state.message}
            onRetry={() => window.location.reload()}
          />
        ) : null}

        {state.status === "ready" && state.data.items.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? "No jobs match your filters" : "No jobs found"}
            description={
              hasActiveFilters
                ? "Try clearing search or filters to see more results."
                : "Create a job to start building your pipeline catalog."
            }
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => {
                    setSearchInput("");
                    updateParams({
                      search: null,
                      job_type: null,
                      status: null,
                      include_archived: null,
                      page: "1",
                    });
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <Link to="/jobs/new" className="btn btn--primary">
                  Create Job
                </Link>
              )
            }
          />
        ) : null}

        {state.status === "ready" && state.data.items.length > 0 ? (
          <>
            <div className="jobs-list__meta">
              <span>
                Showing {(state.data.page - 1) * state.data.page_size + 1}–
                {Math.min(state.data.page * state.data.page_size, state.data.total)} of {state.data.total}
              </span>
            </div>

            <DataTable
              columns={[
                {
                  key: "name",
                  header: "Job",
                  render: (row) => (
                    <button type="button" className="table-link" onClick={() => goToJob(row.id)}>
                      {row.name}
                    </button>
                  ),
                },
                {
                  key: "type",
                  header: "Pipeline",
                  render: (row) => <JobTypeBadge jobType={row.job_type} />,
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
                {
                  key: "actions",
                  header: "",
                  className: "data-table__actions",
                  render: (row) => (
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn--secondary btn--small"
                        onClick={() => goToJob(row.id)}
                      >
                        View
                      </button>
                      {row.status !== "archived" && !row.archived_at ? (
                        <Link to={`/jobs/${row.id}/edit`} className="btn btn--secondary btn--small">
                          Edit
                        </Link>
                      ) : null}
                    </div>
                  ),
                },
              ]}
              rows={state.data.items}
              rowKey={(row) => row.id}
            />

            <div className="pagination">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={state.data.page <= 1}
                onClick={() => updateParams({ page: String(state.data.page - 1) })}
              >
                Previous
              </button>
              <span className="pagination__label">
                Page {state.data.page} of {Math.max(state.data.pages, 1)}
              </span>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={state.data.page >= state.data.pages}
                onClick={() => updateParams({ page: String(state.data.page + 1) })}
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </section>
    </section>
  );
}
