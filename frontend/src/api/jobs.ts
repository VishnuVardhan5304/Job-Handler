import { apiRequest } from "./client";
import type { Job, JobListResponse, JobStatus, JobType } from "../types/api";
import type { JobTemplate } from "../types/template";

export interface JobCreatePayload {
  name: string;
  job_type: JobType;
  source_system?: string;
  target_system?: string;
  status?: JobStatus;
  schedule_cron?: string | null;
  config?: Record<string, unknown> | null;
}

export interface JobUpdatePayload {
  name?: string;
  job_type?: JobType;
  source_system?: string;
  target_system?: string;
  status?: JobStatus;
  schedule_cron?: string | null;
  config?: Record<string, unknown> | null;
}

export interface JobListParams {
  page?: number;
  page_size?: number;
  search?: string;
  job_type?: JobType;
  status?: JobStatus;
  include_archived?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

function toQuery(params: JobListParams): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function fetchJobs(params: JobListParams = {}): Promise<JobListResponse> {
  return apiRequest<JobListResponse>(`/jobs${toQuery(params)}`);
}

export function fetchJob(jobId: string): Promise<Job> {
  return apiRequest<Job>(`/jobs/${jobId}`);
}

export function createJob(payload: JobCreatePayload): Promise<Job> {
  return apiRequest<Job>("/jobs", {
    method: "POST",
    body: payload,
  });
}

export function updateJob(jobId: string, payload: JobUpdatePayload): Promise<Job> {
  return apiRequest<Job>(`/jobs/${jobId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function archiveJob(jobId: string): Promise<Job> {
  return apiRequest<Job>(`/jobs/${jobId}/archive`, {
    method: "POST",
  });
}

export function fetchJobTemplates(): Promise<JobTemplate[]> {
  return apiRequest<JobTemplate[]>("/jobs/templates");
}
