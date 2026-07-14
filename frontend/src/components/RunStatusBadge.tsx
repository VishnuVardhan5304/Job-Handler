import { RUN_STATUS_LABELS } from "../lib/labels";
import type { RunStatus } from "../types/api";
import { StatusBadge, type BadgeTone } from "./StatusBadge";

const STATUS_TONES: Record<RunStatus, BadgeTone> = {
  queued: "neutral",
  running: "info",
  succeeded: "success",
  failed: "danger",
};

interface RunStatusBadgeProps {
  status: RunStatus;
}

export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  return <StatusBadge label={RUN_STATUS_LABELS[status]} tone={STATUS_TONES[status]} />;
}
