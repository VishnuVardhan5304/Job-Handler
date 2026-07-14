-- Job Handler — reference schema (Neon PostgreSQL)
-- Generated from migration 001_initial

CREATE TYPE job_type_enum AS ENUM (
  'EPICOR_GD_WH_SYNC',
  'TXT_TO_RPT',
  'RPT_TO_FABRIC',
  'DATAFLOW_TO_LAKEHOUSE'
);

CREATE TYPE job_status_enum AS ENUM ('draft', 'active', 'paused', 'archived');

CREATE TYPE problem_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE run_status_enum AS ENUM ('queued', 'running', 'succeeded', 'failed');

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  job_type job_type_enum NOT NULL,
  source_system VARCHAR(128) NOT NULL,
  target_system VARCHAR(128) NOT NULL,
  status job_status_enum NOT NULL DEFAULT 'draft',
  schedule_cron VARCHAR(64),
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_jobs_job_type ON jobs (job_type);
CREATE INDEX idx_jobs_status ON jobs (status);
CREATE INDEX idx_jobs_updated_at ON jobs (updated_at);
CREATE INDEX idx_jobs_active ON jobs (updated_at) WHERE archived_at IS NULL;

CREATE TABLE job_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE RESTRICT,
  severity problem_severity_enum NOT NULL DEFAULT 'medium',
  code VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_problems_job_id ON job_problems (job_id);
CREATE INDEX idx_job_problems_severity ON job_problems (severity);
CREATE INDEX idx_job_problems_unresolved ON job_problems (job_id, occurred_at)
  WHERE resolved_at IS NULL;

CREATE TABLE job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE RESTRICT,
  status run_status_enum NOT NULL DEFAULT 'queued',
  message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_runs_job_id ON job_runs (job_id, started_at);

-- Down (reverse order):
-- DROP TABLE job_runs; DROP TABLE job_problems; DROP TABLE jobs;
-- DROP TYPE run_status_enum; DROP TYPE problem_severity_enum;
-- DROP TYPE job_status_enum; DROP TYPE job_type_enum;
