import { JOB_TYPE_LABELS } from "../lib/labels";
import type { JobType } from "../types/api";

interface JobTypeBadgeProps {
  jobType: JobType;
}

export function JobTypeBadge({ jobType }: JobTypeBadgeProps) {
  return <span className="badge badge--pipeline">{JOB_TYPE_LABELS[jobType]}</span>;
}
