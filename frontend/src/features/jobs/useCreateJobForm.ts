import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createJob } from "../../api/jobs";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "../../lib/labels";
import { PIPELINE_DEFAULTS } from "../../lib/pipelineDefaults";
import type { JobStatus, JobType } from "../../types/api";
import type { JobTemplate } from "../../types/template";
import { getErrorMessage, getFieldErrors } from "../../api/errors";

export interface CreateJobFormValues {
  name: string;
  job_type: JobType;
  source_system: string;
  target_system: string;
  status: JobStatus;
  schedule_cron: string;
  config: Record<string, unknown> | null;
  template_id: string | null;
}

const INITIAL_VALUES: CreateJobFormValues = {
  name: "",
  job_type: "TXT_TO_RPT",
  source_system: PIPELINE_DEFAULTS.TXT_TO_RPT.source,
  target_system: PIPELINE_DEFAULTS.TXT_TO_RPT.target,
  status: "draft",
  schedule_cron: "",
  config: null,
  template_id: null,
};

function validate(values: CreateJobFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.name.trim()) errors.name = "Job name is required";
  if (!values.source_system.trim()) errors.source_system = "Source system is required";
  if (!values.target_system.trim()) errors.target_system = "Target system is required";
  return errors;
}

export function useCreateJobForm(initialTemplate?: JobTemplate | null) {
  const navigate = useNavigate();
  const [values, setValues] = useState<CreateJobFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initialTemplate) return;
    setValues({
      name: initialTemplate.default_job_name,
      job_type: initialTemplate.job_type,
      source_system: initialTemplate.source_system,
      target_system: initialTemplate.target_system,
      status: "active",
      schedule_cron: initialTemplate.schedule_cron ?? "",
      config: initialTemplate.config,
      template_id: initialTemplate.id,
    });
  }, [initialTemplate]);

  const setField = <K extends keyof CreateJobFormValues>(field: K, value: CreateJobFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const onJobTypeChange = (jobType: JobType) => {
    const defaults = PIPELINE_DEFAULTS[jobType];
    setValues((current) => ({
      ...current,
      job_type: jobType,
      source_system: defaults.source,
      target_system: defaults.target,
      template_id: null,
      config: null,
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.job_type;
      delete next.source_system;
      delete next.target_system;
      return next;
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const clientErrors = validate(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const created = await createJob({
        name: values.name.trim(),
        job_type: values.job_type,
        source_system: values.source_system.trim(),
        target_system: values.target_system.trim(),
        status: values.status,
        schedule_cron: values.schedule_cron.trim() || null,
        config: values.config,
      });
      return { ok: true as const, jobId: created.id };
    } catch (error: unknown) {
      const fields = getFieldErrors(error);
      if (fields) {
        setErrors(fields);
      } else {
        setErrors({ form: getErrorMessage(error, "Could not create job. Please try again.") });
      }
      return { ok: false as const };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values,
    errors,
    submitting,
    setField,
    onJobTypeChange,
    submit,
    navigate,
    labels: { jobType: JOB_TYPE_LABELS, jobStatus: JOB_STATUS_LABELS },
  };
}
