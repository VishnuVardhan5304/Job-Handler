# User Stories & Acceptance Criteria
# Organization Job Handler — MVP

**Derived from:** SRS v0.1  
**Status:** Awaiting approval before architecture

---

## Priority legend (MoSCoW)

| Label | Meaning |
|-------|---------|
| **MUST** | Required for MVP release |
| **SHOULD** | Important; include if time allows in MVP |
| **COULD** | Nice to have; defer if needed |
| **WON'T** | Explicitly out of MVP |

---

## Admin stories

### US-A01 — Create a pipeline job (MUST)

**As an** Admin,  
**I want** to create a new job with a name, pipeline type, and source ? target systems,  
**So that** the organization has a registered record of each data pipeline we operate.

**Acceptance criteria**

- **Given** I am on the create job screen, **when** I enter a valid name and select job type `TXT_TO_RPT`, **then** source defaults to `TXT` and target defaults to `RPT`.
- **Given** I submit a valid job form, **when** the API accepts the request, **then** I see a success confirmation and the new job appears in the jobs list.
- **Given** I leave required fields empty, **when** I submit, **then** I see field-level validation errors and the job is not created.

---

### US-A02 — Create a job from a pipeline template (MUST)

**As an** Admin,  
**I want** to start from one of the four known pipeline templates,  
**So that** I don’t have to manually configure Epicor, TXT, RPT, Fabric, or Lake House jobs each time.

**Acceptance criteria**

- **Given** I choose the Epicor ? GD Warehouse template, **when** the form opens, **then** job type, source, and target are pre-filled correctly.
- **Given** I choose the Data Flow ? Lake House template, **when** I save, **then** the stored job reflects source `Data Flow` and target `Lake House`.
- **Given** all four templates exist, **when** I open the template picker, **then** I see all four pipeline options with human-readable labels.

---

### US-A03 — Edit an existing job (MUST)

**As an** Admin,  
**I want** to update a job’s name, status, schedule, and configuration,  
**So that** pipeline metadata stays accurate as systems change.

**Acceptance criteria**

- **Given** a job exists, **when** I open edit and change the name, **then** the updated name is saved and shown on the job detail and list.
- **Given** a job is `active`, **when** I set status to `paused`, **then** the job remains visible but shows paused status on dashboard and list.
- **Given** I submit invalid data (e.g. empty name), **when** I save, **then** I see validation errors and no partial save occurs.

---

### US-A04 — Archive an obsolete job (MUST)

**As an** Admin,  
**I want** to archive jobs that are no longer in use,  
**So that** the active catalog stays clean without losing history.

**Acceptance criteria**

- **Given** an active job, **when** I confirm archive, **then** the job status becomes `archived` and it disappears from the default jobs list.
- **Given** an archived job, **when** I view it by direct link or “show archived” filter (if provided), **then** I can still see its details and linked problems.
- **Given** I attempt to archive, **when** the confirmation dialog appears, **then** I must confirm before the action completes.

---

## Operator stories

### US-O01 — View the operations dashboard (MUST)

**As an** Operator,  
**I want** a dashboard showing job counts, recent activity, and open problems,  
**So that** I can quickly see what needs attention at the start of my shift.

**Acceptance criteria**

- **Given** jobs exist in mixed statuses, **when** I open the dashboard, **then** I see counts grouped by status and by job type.
- **Given** there are unresolved problems, **when** the dashboard loads, **then** the unresolved count matches the problems API.
- **Given** the API is unreachable, **when** the dashboard loads, **then** I see a clear error state — not a blank screen.

---

### US-O02 — Browse and filter the jobs list (MUST)

**As an** Operator,  
**I want** to search, filter, and sort jobs,  
**So that** I can find a specific pipeline quickly during incidents.

**Acceptance criteria**

- **Given** multiple jobs exist, **when** I search by name substring, **then** only matching jobs are shown.
- **Given** jobs of different types, **when** I filter by `RPT_TO_FABRIC`, **then** only RPT ? Fabric jobs appear.
- **Given** a long job list, **when** I change sort to “last updated”, **then** the most recently updated job appears first.
- **Given** no jobs match my filters, **when** the list loads, **then** I see an empty state with guidance to adjust filters or create a job.

---

### US-O03 — View job detail and pipeline lineage (MUST)

**As an** Operator,  
**I want** to open a job and see its type, source ? target, status, and related problems,  
**So that** I understand what pipeline failed and what downstream systems are affected.

**Acceptance criteria**

- **Given** a job with type `EPICOR_GD_WH_SYNC`, **when** I open job detail, **then** I see a clear label “Epicor ? GD Warehouse” and source/target fields.
- **Given** a job has three linked problems, **when** I view job detail, **then** all three appear in the problems section.
- **Given** a job has no problems, **when** I view job detail, **then** I see “No open problems” (or equivalent empty state).

---

### US-O04 — Log a job problem (MUST)

**As an** Operator,  
**I want** to record a problem against a job with severity and message,  
**So that** failures and data issues are tracked in context of the right pipeline.

**Acceptance criteria**

- **Given** I am on job detail, **when** I submit a new problem with severity `high` and a message, **then** the problem appears in the list as unresolved.
- **Given** I omit required fields, **when** I submit, **then** validation errors are shown.
- **Given** a problem is created, **when** I return to the dashboard, **then** the unresolved problems count increases by one.

---

### US-O05 — Resolve a job problem (MUST)

**As an** Operator,  
**I want** to mark a problem as resolved,  
**So that** the team knows the incident is closed.

**Acceptance criteria**

- **Given** an unresolved problem, **when** I click resolve and confirm, **then** `resolved_at` is set and the problem no longer appears in the default unresolved filter.
- **Given** a resolved problem, **when** I view job detail with “show all problems”, **then** I can still see the resolved problem with its resolution timestamp.

---

### US-O06 — Simulate a job run (SHOULD)

**As an** Operator,  
**I want** to trigger a simulated run and see its outcome,  
**So that** I can practice the operational flow before real connectors exist.

**Acceptance criteria**

- **Given** an `active` job, **when** I click “Simulate run”, **then** a run record is created with status progressing to `succeeded` or `failed`.
- **Given** a simulated run fails, **when** I choose to log a problem from the failure, **then** a new JobProblem is created linked to that job.
- **Given** multiple runs exist, **when** I view job detail, **then** I see the latest run status and a simple timeline.

---

## Viewer stories

### US-V01 — Read-only access to jobs and dashboard (MUST)

**As a** Viewer,  
**I want** to see the dashboard and job list without edit controls,  
**So that** I can stay informed without risking accidental changes.

**Acceptance criteria**

- **Given** viewer mode (or no auth MVP where all users see data), **when** I open the jobs list, **then** I can read all non-archived job fields.
- **Given** I am a viewer, **when** I view job detail, **then** I do not see create, edit, archive, or resolve actions *(deferred until RBAC; in no-auth MVP all users see actions — document as known gap)*.

---

### US-V02 — View problems without modifying them (MUST)

**As a** Viewer,  
**I want** to read problems on a job,  
**So that** I understand operational issues affecting pipelines I depend on.

**Acceptance criteria**

- **Given** a job with problems, **when** I open job detail, **then** I see severity, code, message, and timestamps for each problem.
- **Given** problems are filtered to unresolved by default, **when** I toggle to show all, **then** resolved problems are visible read-only.

---

## Cross-cutting stories

### US-X01 — Consistent pipeline vocabulary (MUST)

**As a** team member,  
**I want** the same pipeline names everywhere in the UI and API,  
**So that** Epicor ? GD Warehouse means the same thing on the dashboard, list, and detail.

**Acceptance criteria**

- **Given** any screen showing job type, **when** type is `DATAFLOW_TO_LAKEHOUSE`, **then** the label reads “Data Flow ? Lake House”.
- **Given** API responses, **when** job type is returned, **then** enum values match UI badge mapping exactly.

---

### US-X02 — Reliable API error feedback (MUST)

**As an** Operator,  
**I want** clear error messages when an action fails,  
**So that** I know whether to retry or fix my input.

**Acceptance criteria**

- **Given** invalid job type in API request, **when** server responds, **then** I receive HTTP 422 with a readable validation message.
- **Given** network failure, **when** I submit a form, **then** the UI shows a toast or inline error — not a silent failure.

---

## MVP backlog summary

| Priority | Stories |
|----------|---------|
| **MUST** | US-A01, US-A02, US-A03, US-A04, US-O01, US-O02, US-O03, US-O04, US-O05, US-V01, US-V02, US-X01, US-X02 |
| **SHOULD** | US-O06 (simulated runs) |
| **WON'T (MVP)** | Real Epicor/Fabric connectors, SSO, multi-tenant, email alerts |

---

## Traceability to SRS

| Story | SRS requirements |
|-------|------------------|
| US-A01, US-A02 | FR-J01, FR-J09, FR-J10 |
| US-A03 | FR-J07 |
| US-A04 | FR-J08 |
| US-O01 | FR-D01–FR-D05 |
| US-O02 | FR-J02–FR-J05 |
| US-O03 | FR-J06 |
| US-O04, US-O05 | FR-P01–FR-P05 |
| US-O06 | FR-R01–FR-R03, FR-P06 |
| US-X01 | NFR-06 |
| US-X02 | FR-A02, NFR-02 |

---

## Approval

Approve these stories before **Phase 2, Step 9 (architecture design)**.
