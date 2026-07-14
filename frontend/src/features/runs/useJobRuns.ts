import { useCallback, useEffect, useState } from "react";
import { fetchJobRuns, simulateJobRun } from "../../api/runs";
import type { JobRun } from "../../types/api";
import { getErrorMessage } from "../../api/errors";

type RunsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; items: JobRun[]; total: number };

export function useJobRuns(jobId: string | undefined) {
  const [state, setState] = useState<RunsState>({ status: "loading" });
  const [simulating, setSimulating] = useState(false);

  const loadRuns = useCallback(async () => {
    if (!jobId) return;
    setState({ status: "loading" });
    try {
      const data = await fetchJobRuns(jobId, {
        page: 1,
        page_size: 20,
        sort_order: "desc",
      });
      setState({ status: "ready", items: data.items, total: data.total });
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Could not load runs");
      setState({ status: "error", message });
    }
  }, [jobId]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const simulate = async () => {
    if (!jobId) return { ok: false as const };
    setSimulating(true);
    try {
      const run = await simulateJobRun(jobId);
      await loadRuns();
      return { ok: true as const, run };
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Could not simulate run");
      return { ok: false as const, message };
    } finally {
      setSimulating(false);
    }
  };

  return {
    state,
    simulating,
    simulate,
    reload: loadRuns,
  };
}
