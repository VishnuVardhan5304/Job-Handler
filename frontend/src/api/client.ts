import { API_BASE_URL } from "./config";
import type { ApiErrorBody } from "../types/api";
import { ApiError } from "../types/api";

export class NetworkError extends Error {
  constructor(message = "Unable to reach the API. Is the backend running?") {
    super(message);
    this.name = "NetworkError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  skipAuth?: boolean;
};

function authHeaders(): Record<string, string> {
  // Stub for future SSO/JWT — set VITE_API_TOKEN in .env when auth lands
  const token = import.meta.env.VITE_API_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...authHeaders(),
    ...extra,
  };
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

function normalizeErrorBody(raw: unknown, fallbackStatus: string): ApiErrorBody {
  if (raw && typeof raw === "object" && "detail" in raw) {
    const body = raw as ApiErrorBody;
    return {
      detail: typeof body.detail === "string" ? body.detail : fallbackStatus,
      code: body.code ?? "HTTP_ERROR",
      fields: body.fields,
    };
  }
  return { detail: fallbackStatus, code: "HTTP_ERROR" };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, skipAuth: _skipAuth, ...rest } = options;
  const url = `${API_BASE_URL}${normalizePath(path)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: buildHeaders(headers),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new NetworkError();
  }

  if (!response.ok) {
    let errorBody: ApiErrorBody;
    try {
      const raw = await parseJson<unknown>(response);
      errorBody = normalizeErrorBody(raw, response.statusText);
    } catch {
      errorBody = { detail: response.statusText || "Request failed", code: "HTTP_ERROR" };
    }
    throw new ApiError(response.status, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return parseJson<T>(response);
}

export async function apiHealthCheck<T>(): Promise<T> {
  const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  const url = `${base}/api/v1/health`;

  let response: Response;
  try {
    response = await fetch(url, { headers: buildHeaders() });
  } catch {
    throw new NetworkError();
  }

  if (!response.ok) {
    throw new ApiError(response.status, {
      detail: `Health check failed (${response.status})`,
      code: "HEALTH_ERROR",
    });
  }

  return parseJson<T>(response);
}
