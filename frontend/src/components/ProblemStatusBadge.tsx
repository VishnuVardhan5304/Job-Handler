import { PROBLEM_STATUS_LABELS } from "../lib/labels";
import type { ProblemStatus } from "../types/api";
import { StatusBadge, type BadgeTone } from "./StatusBadge";

const STATUS_TONES: Record<ProblemStatus, BadgeTone> = {
  open: "warning",
  closed: "success",
};

interface ProblemStatusBadgeProps {
  status: ProblemStatus;
}

export function ProblemStatusBadge({ status }: ProblemStatusBadgeProps) {
  return <StatusBadge label={PROBLEM_STATUS_LABELS[status]} tone={STATUS_TONES[status]} />;
}
