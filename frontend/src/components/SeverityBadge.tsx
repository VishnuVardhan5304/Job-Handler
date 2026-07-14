import { SEVERITY_LABELS } from "../lib/labels";
import type { ProblemSeverity } from "../types/api";
import { StatusBadge, type BadgeTone } from "./StatusBadge";

const SEVERITY_TONES: Record<ProblemSeverity, BadgeTone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

interface SeverityBadgeProps {
  severity: ProblemSeverity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return <StatusBadge label={SEVERITY_LABELS[severity]} tone={SEVERITY_TONES[severity]} />;
}
