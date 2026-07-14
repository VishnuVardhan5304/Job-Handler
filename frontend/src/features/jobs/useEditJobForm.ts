import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { archiveJob, fetchJob, updateJob } from "../../api/jobs";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "../../lib/labels";
import { PIPELINE_DEFAULTS } from "../../lib/pipelineDefaults";
import type { Job, JobStatus, JobType } from "../../types/api";
import { getErrorMessage, getFieldErrors } from "../../api/errors";

export interface EditJobFormValues {
  name: string;
  job_type: JobType;
  source_system: string;
  target_system: string;
  status: JobStatus;
  schedule_cron: string;
}

function jobToValues(job: Job): EditJobFormValues {
  return {
    name: job.name,
    job_type: job.job_type,
    source_system: job.source_system,
    target_system: job.target_system,
    status: job.status,
    schedule_cron: job.schedule_cron ?? "",
  };
}

function validate(values: EditJobFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.name.trim()) errors.name = "Job name is required";
  if (!values.source_system.trim()) errors.source_system = "Source system is required";
  if (!values.target_system.trim()) errors.target_system = "Target system is required";
  return errors;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; job: Job };

export function useEditJobForm(jobId: string | undefined) {
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [values, setValues] = useState<EditJobFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setLoadState({ status: "error", message: "Missing job id" });
      return;
    }

    let active = true;
    setLoadState({ status: "loading" });

    fetchJob(jobId)
      .then((job) => {
        if (!active) return;
        setLoadState({ status: "ready", job });
        setValues(jobToValues(job));
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = getErrorMessage(error, "Could not load job");
        setLoadState({ status: "error", message });
      });

    return () => {
      active = false;
    };
  }, [jobId]);

  const setField = <K extends keyof EditJobFormValues>(field: K, value: EditJobFormValues[K]) => {
    setValues((current) => (current ? { ...current, [field]: value } : current));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const onJobTypeChange = (jobType: JobType) => {
    const defaults = PIPELINE_DEFAULTS[jobType];
    setValues((current) =>
      current
        ? {
            ...current,
            job_type: jobType,
            source_system: defaults.source,
            target_system: defaults.target,
          }
        : current,
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!jobId || !values) return;

    const clientErrors = validate(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const updated = await updateJob(jobId, {
        name: values.name.trim(),
        job_type: values.job_type,
        source_system: values.source_system.trim(),
        target_system: values.target_system.trim(),
        status: values.status,
        schedule_cron: values.schedule_cron.trim() || null,
      });
      setLoadState({ status: "ready", job: updated });
      setValues(jobToValues(updated));
      return { ok: true as const };
    } catch (error: unknown) {
      const fields = getFieldErrors(error);
      if (fields) {
        setErrors(fields);
      } else {
        setErrors({ form: getErrorMessage(error, "Could not update job. Please try again.") });
      }
      return { ok: false as const };
    } finally {
      setSubmitting(false);
    }
  };

  const confirmArchive = async () => {
    if (!jobId) return { ok: false as const };

    setArchiving(true);
    setErrors({});

    try {
      await archiveJob(jobId);
      setArchiveOpen(false);
      return { ok: true as const };
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Could not archive job. Please try again.");
      setErrors({ form: message });
      setArchiveOpen(false);
      return { ok: false as const };
    } finally {
      setArchiving(false);
    }
  };

  const isArchived =
    loadState.status === "ready" &&
    (loadState.job.archived_at !== null || loadState.job.status === "archived");

  return {
    loadState,
    values,
    errors,
    submitting,
    archiving,
    archiveOpen,
    setArchiveOpen,
    setField,
    onJobTypeChange,
    submit,
    confirmArchive,
    navigate,
    isArchived,
    labels: { jobType: JOB_TYPE_LABELS, jobStatus: JOB_STATUS_LABELS },
  };
}
