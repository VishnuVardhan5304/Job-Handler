import { useState } from "react";
import { DataTable } from "../components/DataTable";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { JobStatusBadge } from "../components/JobStatusBadge";
import { JobTypeBadge } from "../components/JobTypeBadge";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { SeverityBadge } from "../components/SeverityBadge";
import { useToast } from "../components/Toast";
import type { Job } from "../types/api";

const SAMPLE_ROWS: Job[] = [
  {
    id: "1",
    name: "Epicor GD Warehouse Sync",
    job_type: "EPICOR_GD_WH_SYNC",
    source_system: "Epicor",
    target_system: "GD Warehouse",
    status: "active",
    schedule_cron: "0 2 * * *",
    config: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
  },
  {
    id: "2",
    name: "TXT to RPT Load",
    job_type: "TXT_TO_RPT",
    source_system: "TXT",
    target_system: "RPT",
    status: "paused",
    schedule_cron: null,
    config: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
  },
];

export function DevUiPage() {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="panel dev-ui">
      <PageHeader
        title="UI component preview"
        subtitle="Temporary route for reviewing shared primitives before job pages are built."
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setModalOpen(true)}>
            Open modal
          </button>
        }
      />

      <div className="dev-ui__section">
        <h2>Badges</h2>
        <div className="dev-ui__row">
          <JobTypeBadge jobType="EPICOR_GD_WH_SYNC" />
          <JobTypeBadge jobType="TXT_TO_RPT" />
          <JobTypeBadge jobType="RPT_TO_FABRIC" />
          <JobTypeBadge jobType="DATAFLOW_TO_LAKEHOUSE" />
        </div>
        <div className="dev-ui__row">
          <JobStatusBadge status="draft" />
          <JobStatusBadge status="active" />
          <JobStatusBadge status="paused" />
          <JobStatusBadge status="archived" />
        </div>
        <div className="dev-ui__row">
          <SeverityBadge severity="low" />
          <SeverityBadge severity="medium" />
          <SeverityBadge severity="high" />
          <SeverityBadge severity="critical" />
        </div>
      </div>

      <div className="dev-ui__section">
        <h2>Data table</h2>
        <DataTable
          columns={[
            { key: "name", header: "Job", render: (row) => row.name },
            { key: "type", header: "Pipeline", render: (row) => <JobTypeBadge jobType={row.job_type} /> },
            { key: "status", header: "Status", render: (row) => <JobStatusBadge status={row.status} /> },
          ]}
          rows={SAMPLE_ROWS}
          rowKey={(row) => row.id}
        />
      </div>

      <div className="dev-ui__section">
        <h2>Form field</h2>
        <FormField label="Job name" htmlFor="preview-name" hint="Shown on dashboard and job list">
          <input id="preview-name" className="input" placeholder="e.g. Nightly TXT Load" />
        </FormField>
      </div>

      <div className="dev-ui__section">
        <h2>Empty state & toasts</h2>
        <EmptyState
          title="No open problems"
          description="When a job has no unresolved problems, this is what operators will see."
          action={
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => showToast("Example success toast", "success")}
            >
              Show toast
            </button>
          }
        />
      </div>

      <Modal
        open={modalOpen}
        title="Example modal"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn--secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary" onClick={() => setModalOpen(false)}>
              Confirm
            </button>
          </>
        }
      >
        <p>Modals will be used for confirmations and compact forms.</p>
      </Modal>
    </section>
  );
}
