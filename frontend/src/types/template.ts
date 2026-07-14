import type { JobType } from "../types/api";

export interface JobTemplate {
  id: string;
  name: string;
  description: string;
  job_type: JobType;
  source_system: string;
  target_system: string;
  default_job_name: string;
  schedule_cron: string | null;
  config: Record<string, unknown>;
  integration_mode: "simulated" | "integrated" | string;
}
