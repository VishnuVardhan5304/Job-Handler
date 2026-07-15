import type { JobStatus, JobType, ProblemSeverity, ProblemStatus, RunStatus } from "../types/api";

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  EPICOR_GD_WH_SYNC: "Epicor → GD Warehouse",
  TXT_TO_RPT: "TXT → RPT",
  RPT_TO_FABRIC: "RPT → Fabric",
  DATAFLOW_TO_LAKEHOUSE: "Data Flow → Lake House",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

export const SEVERITY_LABELS: Record<ProblemSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const PROBLEM_STATUS_LABELS: Record<ProblemStatus, string> = {
  open: "Open",
  closed: "Closed",
};

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  queued: "Queued",
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
};
