import { useEffect, useState } from "react";
import { fetchJobs } from "../../api/jobs";
import { fetchProblems } from "../../api/problems";
import type { Job, JobStatus, JobType } from "../../types/api";
import { getErrorMessage } from "../../api/errors";

export interface DashboardData {
  totalJobs: number;
  statusCounts: Record<JobStatus, number>;
  typeCounts: Record<JobType, number>;
  recentJobs: Job[];
  unresolvedProblems: number;
}

export const ALL_STATUSES: JobStatus[] = ["draft", "active", "paused", "archived"];
export const ALL_TYPES: JobType[] = [
  "EPICOR_GD_WH_SYNC",
  "TXT_TO_RPT",
  "RPT_TO_FABRIC",
  "DATAFLOW_TO_LAKEHOUSE",
];

function emptyStatusCounts(): Record<JobStatus, number> {
  return { draft: 0, active: 0, paused: 0, archived: 0 };
}

function emptyTypeCounts(): Record<JobType, number> {
  return {
    EPICOR_GD_WH_SYNC: 0,
    TXT_TO_RPT: 0,
    RPT_TO_FABRIC: 0,
    DATAFLOW_TO_LAKEHOUSE: 0,
  };
}

function buildDashboard(jobs: Job[], totalJobs: number, unresolvedTotal: number): DashboardData {
  const statusCounts = emptyStatusCounts();
  const typeCounts = emptyTypeCounts();

  // Status/type chips reflect the fetched page sample until a dedicated stats API exists.
  for (const job of jobs) {
    statusCounts[job.status] += 1;
    typeCounts[job.job_type] += 1;
  }

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10);

  return {
    totalJobs,
    statusCounts,
    typeCounts,
    recentJobs,
    unresolvedProblems: unresolvedTotal,
  };
}

type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: DashboardData };

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [jobsResponse, problemsResponse] = await Promise.all([
          fetchJobs({ page: 1, page_size: 100, sort_by: "updated_at", sort_order: "desc" }),
          fetchProblems({ page: 1, page_size: 1, unresolved_only: true }),
        ]);

        if (!active) return;

        const data = buildDashboard(
          jobsResponse.items,
          jobsResponse.total,
          problemsResponse.total,
        );
        setState({ status: "ready", data });
      } catch (error: unknown) {
        if (!active) return;
        const message = getErrorMessage(error, "Could not load dashboard data");
        setState({ status: "error", message });
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
