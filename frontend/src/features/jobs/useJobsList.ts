import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchJobs, type JobListParams } from "../../api/jobs";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "../../lib/labels";
import type { JobListResponse, JobStatus, JobType } from "../../types/api";
import { getErrorMessage } from "../../api/errors";

const PAGE_SIZE = 10;

type JobsListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: JobListResponse };

function readParam(params: URLSearchParams, key: string, fallback = ""): string {
  return params.get(key) ?? fallback;
}

export function useJobsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<JobsListState>({ status: "loading" });
  const [searchInput, setSearchInput] = useState(() => readParam(searchParams, "search"));

  const filters = useMemo(() => {
    const page = Math.max(1, Number(readParam(searchParams, "page", "1")) || 1);
    const sortBy = readParam(searchParams, "sort_by", "updated_at");
    const sortOrder = readParam(searchParams, "sort_order", "desc") as "asc" | "desc";
    const jobType = readParam(searchParams, "job_type") as JobType | "";
    const status = readParam(searchParams, "status") as JobStatus | "";

    return {
      page,
      page_size: PAGE_SIZE,
      search: readParam(searchParams, "search") || undefined,
      job_type: jobType || undefined,
      status: status || undefined,
      include_archived: searchParams.get("include_archived") === "true",
      sort_by: sortBy,
      sort_order: sortOrder,
    } satisfies JobListParams;
  }, [searchParams]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    let active = true;

    async function load() {
      setState({ status: "loading" });
      try {
        const data = await fetchJobs(filters);
        if (!active) return;
        setState({ status: "ready", data });
      } catch (error: unknown) {
        if (!active) return;
        const message = getErrorMessage(error, "Could not load jobs");
        setState({ status: "error", message });
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [filters]);

  const reload = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await fetchJobs(filters);
      setState({ status: "ready", data });
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Could not load jobs");
      setState({ status: "error", message });
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = readParam(searchParams, "search");
      if (searchInput.trim() === current.trim()) return;
      updateParams({ search: searchInput.trim() || null, page: "1" });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput, searchParams, updateParams]);

  const goToJob = useCallback(
    (jobId: string) => {
      navigate(`/jobs/${jobId}`);
    },
    [navigate],
  );

  return {
    state,
    searchInput,
    setSearchInput,
    filters,
    updateParams,
    goToJob,
    reload,
  };
}

export { JOB_STATUS_LABELS, JOB_TYPE_LABELS, PAGE_SIZE };
