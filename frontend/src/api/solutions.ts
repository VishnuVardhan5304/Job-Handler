import { apiRequest } from "./client";
import { toQuery } from "./toQuery";
import type { JobSolution, JobSolutionListResponse } from "../types/api";

export interface SolutionCreatePayload {
  job_problem_id: string;
  summary: string;
  details: string;
  metadata?: Record<string, unknown> | null;
}

export interface SolutionListParams {
  page?: number;
  page_size?: number;
  job_problem_id?: string;
  sort_order?: "asc" | "desc";
}

export function fetchJobSolutions(
  jobId: string,
  params: SolutionListParams = {},
): Promise<JobSolutionListResponse> {
  return apiRequest<JobSolutionListResponse>(`/jobs/${jobId}/solutions${toQuery(params)}`);
}

export function createJobSolution(jobId: string, payload: SolutionCreatePayload): Promise<JobSolution> {
  return apiRequest<JobSolution>(`/jobs/${jobId}/solutions`, {
    method: "POST",
    body: payload,
  });
}
