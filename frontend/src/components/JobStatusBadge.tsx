import { JOB_STATUS_LABELS } from "../lib/labels";
import type { JobStatus } from "../types/api";
import { StatusBadge, type BadgeTone } from "./StatusBadge";

const STATUS_TONES: Record<JobStatus, BadgeTone> = {
  draft: "neutral",
  active: "success",
  paused: "warning",
  archived: "danger",
};

interface JobStatusBadgeProps {
  status: JobStatus;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  return <StatusBadge label={JOB_STATUS_LABELS[status]} tone={STATUS_TONES[status]} />;
}
