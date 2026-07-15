import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createJobSolution, fetchJobSolutions } from "../../api/solutions";
import type { JobSolution } from "../../types/api";
import { getErrorMessage, getFieldErrors } from "../../api/errors";

export interface AddSolutionFormValues {
  job_problem_id: string;
  summary: string;
  details: string;
}

const INITIAL_FORM: AddSolutionFormValues = {
  job_problem_id: "",
  summary: "",
  details: "",
};

type SolutionsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; items: JobSolution[]; total: number };

export function useJobSolutions(jobId: string | undefined, problemFilter: string | null) {
  const [state, setState] = useState<SolutionsState>({ status: "loading" });
  const [form, setForm] = useState<AddSolutionFormValues>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadSolutions = useCallback(async () => {
    if (!jobId) return;
    setState({ status: "loading" });
    try {
      const data = await fetchJobSolutions(jobId, {
        page: 1,
        page_size: 50,
        job_problem_id: problemFilter || undefined,
        sort_order: "desc",
      });
      setState({ status: "ready", items: data.items, total: data.total });
    } catch (error: unknown) {
      setState({ status: "error", message: getErrorMessage(error, "Could not load solutions") });
    }
  }, [jobId, problemFilter]);

  useEffect(() => {
    loadSolutions();
  }, [loadSolutions]);

  useEffect(() => {
    if (problemFilter) {
      setForm((current) => ({ ...current, job_problem_id: problemFilter }));
    }
  }, [problemFilter]);

  const setField = <K extends keyof AddSolutionFormValues>(
    field: K,
    value: AddSolutionFormValues[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const selectProblem = (problemId: string) => {
    setForm((current) => ({ ...current, job_problem_id: problemId }));
    setFormErrors({});
  };

  const submitSolution = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!jobId) return { ok: false as const };

    const errors: Record<string, string> = {};
    if (!form.job_problem_id.trim()) errors.job_problem_id = "Select a problem";
    if (!form.summary.trim()) errors.summary = "Summary is required";
    if (!form.details.trim()) errors.details = "Details are required";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return { ok: false as const };
    }

    setSubmitting(true);
    setFormErrors({});
    try {
      await createJobSolution(jobId, {
        job_problem_id: form.job_problem_id,
        summary: form.summary.trim(),
        details: form.details.trim(),
      });
      setForm({ ...INITIAL_FORM, job_problem_id: form.job_problem_id });
      await loadSolutions();
      return { ok: true as const };
    } catch (error: unknown) {
      const fields = getFieldErrors(error);
      if (fields) setFormErrors(fields);
      else setFormErrors({ form: getErrorMessage(error, "Could not save solution") });
      return { ok: false as const };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    state,
    form,
    formErrors,
    submitting,
    setField,
    selectProblem,
    submitSolution,
    reload: loadSolutions,
  };
}
