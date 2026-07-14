import { apiHealthCheck } from "./client";
import type { HealthResponse } from "../types/api";

export function fetchHealth(): Promise<HealthResponse> {
  return apiHealthCheck<HealthResponse>();
}
