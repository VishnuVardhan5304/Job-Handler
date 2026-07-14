import { NetworkError } from "./client";
import { ApiError } from "../types/api";

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof NetworkError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string> | undefined {
  if (error instanceof ApiError) return error.fields;
  return undefined;
}

export { NetworkError } from "./client";
