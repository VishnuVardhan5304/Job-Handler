export type JobType =
  | "EPICOR_GD_WH_SYNC"
  | "TXT_TO_RPT"
  | "RPT_TO_FABRIC"
  | "DATAFLOW_TO_LAKEHOUSE"
  | "TASK_SCHEDULER";

export type JobStatus = "draft" | "active" | "paused" | "archived";

export type ProblemSeverity = "low" | "medium" | "high" | "critical";

export type ProblemStatus = "open" | "closed";

export type RunStatus = "queued" | "running" | "succeeded" | "failed";

export interface Job {
  id: string;
  name: string;
  job_type: JobType;
  source_system: string;
  target_system: string;
  status: JobStatus;
  schedule_cron: string | null;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface JobListResponse {
  items: Job[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface JobProblem {
  id: string;
  job_id: string;
  severity: ProblemSeverity;
  status: ProblemStatus;
  code: string;
  message: string;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobProblemListResponse {
  items: JobProblem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface JobSolution {
  id: string;
  job_problem_id: string;
  summary: string;
  details: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface JobSolutionListResponse {
  items: JobSolution[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface JobRun {
  id: string;
  job_id: string;
  status: RunStatus;
  message: string | null;
  started_at: string;
  finished_at: string | null;
  created_at: string;
}

export interface JobRunListResponse {
  items: JobRun[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface HealthResponse {
  status: string;
  database: string;
}

export interface ApiErrorBody {
  detail: string;
  code: string;
  fields?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.detail);
    this.status = status;
    this.code = body.code;
    this.fields = body.fields;
  }
}
