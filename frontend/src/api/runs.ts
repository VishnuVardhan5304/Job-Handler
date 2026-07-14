import { apiRequest } from "./client";
import { toQuery } from "./toQuery";
import type { JobRun, JobRunListResponse } from "../types/api";

export interface JobRunListParams {
  page?: number;
  page_size?: number;
  sort_order?: "asc" | "desc";
}

export function fetchJobRuns(jobId: string, params: JobRunListParams = {}): Promise<JobRunListResponse> {
  return apiRequest<JobRunListResponse>(`/jobs/${jobId}/runs${toQuery(params)}`);
}

export function simulateJobRun(jobId: string): Promise<JobRun> {
  return apiRequest<JobRun>(`/jobs/${jobId}/runs/simulate`, {
    method: "POST",
  });
}
