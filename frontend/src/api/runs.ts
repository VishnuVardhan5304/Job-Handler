import { apiRequest } from "./client";
import type { JobRun, JobRunListResponse } from "../types/api";

export interface JobRunListParams {
  page?: number;
  page_size?: number;
  sort_order?: "asc" | "desc";
}

function toQuery(params: JobRunListParams): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function fetchJobRuns(jobId: string, params: JobRunListParams = {}): Promise<JobRunListResponse> {
  return apiRequest<JobRunListResponse>(`/jobs/${jobId}/runs${toQuery(params)}`);
}

export function simulateJobRun(jobId: string): Promise<JobRun> {
  return apiRequest<JobRun>(`/jobs/${jobId}/runs/simulate`, {
    method: "POST",
  });
}
