import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createJobProblem, fetchJobProblems, resolveProblem } from "../../api/problems";
import type { JobProblem, ProblemSeverity } from "../../types/api";
import { getErrorMessage, getFieldErrors } from "../../api/errors";

export interface AddProblemFormValues {
  severity: ProblemSeverity;
  code: string;
  message: string;
}

const INITIAL_FORM: AddProblemFormValues = {
  severity: "medium",
  code: "",
  message: "",
};

type ProblemsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; items: JobProblem[]; total: number };

export function useJobProblems(jobId: string | undefined, unresolvedOnly: boolean) {
  const [state, setState] = useState<ProblemsState>({ status: "loading" });
  const [form, setForm] = useState<AddProblemFormValues>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadProblems = useCallback(async () => {
    if (!jobId) return;
    setState({ status: "loading" });
    try {
      const data = await fetchJobProblems(jobId, {
        page: 1,
        page_size: 50,
        unresolved_only: unresolvedOnly,
        sort_order: "desc",
      });
      setState({ status: "ready", items: data.items, total: data.total });
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Could not load problems");
      setState({ status: "error", message });
    }
  }, [jobId, unresolvedOnly]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const prefillProblem = (values: Partial<AddProblemFormValues>) => {
    setForm((current) => ({ ...current, ...values }));
    setFormErrors({});
  };

  const setField = <K extends keyof AddProblemFormValues>(field: K, value: AddProblemFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submitProblem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!jobId) return { ok: false as const };

    const errors: Record<string, string> = {};
    if (!form.code.trim()) errors.code = "Code is required";
    if (!form.message.trim()) errors.message = "Message is required";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return { ok: false as const };
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      await createJobProblem(jobId, {
        severity: form.severity,
        code: form.code.trim(),
        message: form.message.trim(),
      });
      setForm(INITIAL_FORM);
      await loadProblems();
      return { ok: true as const };
    } catch (error: unknown) {
      const fields = getFieldErrors(error);
      if (fields) {
        setFormErrors(fields);
      } else {
        setFormErrors({ form: getErrorMessage(error, "Could not create problem") });
      }
      return { ok: false as const };
    } finally {
      setSubmitting(false);
    }
  };

  const resolve = async (problemId: string) => {
    setResolvingId(problemId);
    try {
      await resolveProblem(problemId);
      await loadProblems();
      return { ok: true as const };
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Could not resolve problem");
      return { ok: false as const, message };
    } finally {
      setResolvingId(null);
    }
  };

  return {
    state,
    form,
    formErrors,
    submitting,
    resolvingId,
    setField,
    submitProblem,
    resolve,
    reload: loadProblems,
    prefillProblem,
  };
}
