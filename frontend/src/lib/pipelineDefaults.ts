import type { JobType } from "../types/api";

export const PIPELINE_DEFAULTS: Record<JobType, { source: string; target: string }> = {
  EPICOR_GD_WH_SYNC: { source: "Epicor", target: "GD Warehouse" },
  TXT_TO_RPT: { source: "TXT", target: "RPT" },
  RPT_TO_FABRIC: { source: "RPT", target: "Fabric" },
  DATAFLOW_TO_LAKEHOUSE: { source: "Data Flow", target: "Lake House" },
};
