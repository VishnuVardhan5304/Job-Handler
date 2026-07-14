import { apiRequest } from "./client";
import { toQuery } from "./toQuery";
import type { JobProblem, JobProblemListResponse, ProblemSeverity } from "../types/api";

export interface ProblemCreatePayload {
  severity?: ProblemSeverity;
  code: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  occurred_at?: string | null;
}

export interface ProblemListParams {
  page?: number;
  page_size?: number;
  job_id?: string;
  severity?: ProblemSeverity;
  unresolved_only?: boolean;
  sort_order?: "asc" | "desc";
}

export function fetchProblems(params: ProblemListParams = {}): Promise<JobProblemListResponse> {
  return apiRequest<JobProblemListResponse>(`/problems${toQuery(params)}`);
}

export function fetchJobProblems(
  jobId: string,
  params: Omit<ProblemListParams, "job_id"> = {},
): Promise<JobProblemListResponse> {
  return apiRequest<JobProblemListResponse>(`/jobs/${jobId}/problems${toQuery(params)}`);
}

export function createJobProblem(jobId: string, payload: ProblemCreatePayload): Promise<JobProblem> {
  return apiRequest<JobProblem>(`/jobs/${jobId}/problems`, {
    method: "POST",
    body: payload,
  });
}

export function resolveProblem(problemId: string): Promise<JobProblem> {
  return apiRequest<JobProblem>(`/problems/${problemId}/resolve`, {
    method: "POST",
  });
}
