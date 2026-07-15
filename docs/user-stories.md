# User Stories & Acceptance Criteria
# Organization Job Handler

**Access model:** **Open full access** ? anyone who can open the app or call the API may use every feature. There are **no Admin / Operator / Viewer roles**, no login, and no permission checks.

---

## Priority legend (MoSCoW)

| Label | Meaning |
|-------|---------|
| **MUST** | Required |
| **SHOULD** | Important if time allows |
| **COULD** | Nice to have |
| **WON'T** | Out of scope for current product |

---

## Job catalog

### US-J01 ? Create a pipeline job (MUST)

**As anyone using the Job Handler,**  
**I want** to create a new job with a name, pipeline type, and source ? target systems,  
**So that** the organization has a registered record of each data pipeline we operate.

**Acceptance criteria**

- **Given** I am on the create job screen, **when** I enter a valid name and select job type `TXT_TO_RPT`, **then** source defaults to `TXT` and target defaults to `RPT`.
- **Given** I submit a valid job form, **when** the API accepts the request, **then** I see a success confirmation and the new job appears in the jobs list.
- **Given** I leave required fields empty, **when** I submit, **then** I see field-level validation errors and the job is not created.

---

### US-J02 ? Create a job from a pipeline template (MUST)

**As anyone using the Job Handler,**  
**I want** to start from one of the four known pipeline templates,  
**So that** I don?t have to manually configure Epicor, TXT, RPT, Fabric, or Lake House jobs each time.

**Acceptance criteria**

- **Given** I choose the Epicor ? GD Warehouse template, **when** the form opens, **then** job type, source, and target are pre-filled correctly.
- **Given** I choose the Data Flow ? Lake House template, **when** I save, **then** the stored job reflects source `Data Flow` and target `Lake House`.
- **Given** all four templates exist, **when** I open the template picker, **then** I see all four pipeline options with human-readable labels.

---

### US-J03 ? Edit an existing job (MUST)

**As anyone using the Job Handler,**  
**I want** to update a job?s name, status, schedule, and configuration,  
**So that** pipeline metadata stays accurate as systems change.

**Acceptance criteria**

- **Given** a job exists, **when** I open edit and change the name, **then** the updated name is saved and shown on the job detail and list.
- **Given** a job is `active`, **when** I set status to `paused`, **then** the job remains visible but shows paused status on dashboard and list.
- **Given** I submit invalid data (e.g. empty name), **when** I save, **then** I see validation errors and no partial save occurs.

---

### US-J04 ? Archive an obsolete job (MUST)

**As anyone using the Job Handler,**  
**I want** to archive jobs that are no longer in use,  
**So that** the active catalog stays clean without losing history.

**Acceptance criteria**

- **Given** an active job, **when** I confirm archive, **then** the job status becomes `archived` and it disappears from the default jobs list.
- **Given** an archived job, **when** I view it by direct link or ?show archived? filter, **then** I can still see its details and linked problems.
- **Given** I attempt to archive, **when** the confirmation dialog appears, **then** I must confirm before the action completes.

---

## Monitoring & problems

### US-M01 ? View the operations dashboard (MUST)

**As anyone using the Job Handler,**  
**I want** a dashboard showing job counts, recent activity, and open problems,  
**So that** I can quickly see what needs attention.

**Acceptance criteria**

- **Given** jobs exist in mixed statuses, **when** I open the dashboard, **then** I see counts grouped by status and by job type.
- **Given** there are unresolved problems, **when** the dashboard loads, **then** the unresolved count matches the problems API.
- **Given** the API is unreachable, **when** the dashboard loads, **then** I see a clear error state ? not a blank screen.

---

### US-M02 ? Browse and filter the jobs list (MUST)

**As anyone using the Job Handler,**  
**I want** to search, filter, and sort jobs,  
**So that** I can find a specific pipeline quickly when a job problem occurs.

**Acceptance criteria**

- **Given** multiple jobs exist, **when** I search by name substring, **then** only matching jobs are shown.
- **Given** jobs of different types, **when** I filter by `RPT_TO_FABRIC`, **then** only RPT ? Fabric jobs appear.
- **Given** a long job list, **when** I change sort to ?last updated?, **then** the most recently updated job appears first.
- **Given** no jobs match my filters, **when** the list loads, **then** I see an empty state with guidance to adjust filters or create a job.

---

### US-M03 ? View job detail and pipeline lineage (MUST)

**As anyone using the Job Handler,**  
**I want** to open a job and see its type, source ? target, status, related problems, and runs,  
**So that** I understand what pipeline failed and what downstream systems are affected.

**Acceptance criteria**

- **Given** a job with type `EPICOR_GD_WH_SYNC`, **when** I open job detail, **then** I see a clear label ?Epicor ? GD Warehouse? and source/target fields.
- **Given** a job has three linked problems, **when** I view job detail, **then** all three appear in the problems section.
- **Given** a job has no problems, **when** I view job detail, **then** I see ?No open problems? (or equivalent empty state).

---

### US-M04 ? Log a job problem (MUST)

**As anyone using the Job Handler,**  
**I want** to record a problem against a job with severity and message,  
**So that** failures and data issues are tracked in context of the right pipeline.

**Acceptance criteria**

- **Given** I am on job detail, **when** I submit a new problem with severity `high` and a message, **then** the problem appears in the list as unresolved.
- **Given** I omit required fields, **when** I submit, **then** validation errors are shown.
- **Given** a problem is created, **when** I return to the dashboard, **then** the unresolved problems count increases by one.

---

### US-M05 ? Resolve a job problem (MUST)

**As anyone using the Job Handler,**  
**I want** to mark a problem as resolved,  
**So that** the team knows the job problem is closed.

**Acceptance criteria**

- **Given** an unresolved problem, **when** I click resolve, **then** `resolved_at` is set and the problem no longer appears in the default unresolved filter.
- **Given** a resolved problem, **when** I view job detail with ?show all problems?, **then** I can still see the resolved problem with its resolution timestamp.

---

### US-M06 ? Simulate a job run (SHOULD)

**As anyone using the Job Handler,**  
**I want** to trigger a simulated run and see its outcome,  
**So that** I can exercise the operational flow before real connectors exist.

**Acceptance criteria**

- **Given** an `active` job, **when** I click ?Simulate run?, **then** a run record is created with terminal status `succeeded` or `failed`.
- **Given** a simulated run fails, **when** I choose to log a problem from the failure, **then** problem fields can be pre-filled (e.g. `RUN_FAILED`).
- **Given** multiple runs exist, **when** I view job detail, **then** I see run history with status and timestamps.

---

## Cross-cutting

### US-X01 ? Consistent pipeline vocabulary (MUST)

**As anyone using the Job Handler,**  
**I want** the same pipeline names everywhere in the UI and API,  
**So that** Epicor ? GD Warehouse means the same thing on the dashboard, list, and detail.

**Acceptance criteria**

- **Given** any screen showing job type, **when** type is `DATAFLOW_TO_LAKEHOUSE`, **then** the label reads ?Data Flow ? Lake House?.
- **Given** API responses, **when** job type is returned, **then** enum values match UI badge mapping exactly.

---

### US-X02 ? Reliable API error feedback (MUST)

**As anyone using the Job Handler,**  
**I want** clear error messages when an action fails,  
**So that** I know whether to retry or fix my input.

**Acceptance criteria**

- **Given** invalid input in an API request, **when** the server responds, **then** I receive HTTP 422 with a readable validation message (`detail` / `code` / optional `fields`).
- **Given** network failure, **when** I submit a form, **then** the UI shows a toast or inline error ? not a silent failure.

---

### US-X03 ? Open full access (MUST)

**As anyone who can reach the Job Handler,**  
**I want** full use of every screen and API action without login or roles,  
**So that** there are no permission barriers while collaborating on the pipeline console.

**Acceptance criteria**

- **Given** the UI is open, **when** I use create, edit, archive, log problem, resolve, or simulate run, **then** the actions are available (no role-gated UI).
- **Given** the API is reachable, **when** I call mutating endpoints without credentials, **then** the server does not reject for authentication or authorization.

---

## Backlog summary

| Priority | Stories |
|----------|---------|
| **MUST** | US-J01?J04, US-M01?M05, US-X01?X03 |
| **SHOULD** | US-M06 (simulated runs) |
| **WON'T** | Auth / SSO / RBAC, Admin/Operator/Viewer roles, real Epicor/Fabric connectors, multi-tenant, email alerts |

---

## Traceability to SRS

| Story | SRS requirements |
|-------|------------------|
| US-J01, US-J02 | FR-J01, FR-J09, FR-J10 |
| US-J03 | FR-J07 |
| US-J04 | FR-J08 |
| US-M01 | FR-D01?FR-D05 |
| US-M02 | FR-J02?FR-J05 |
| US-M03 | FR-J06 |
| US-M04, US-M05 | FR-P01?FR-P05 |
| US-M06 | FR-R01?FR-R03, FR-P06 |
| US-X01 | NFR-06 |
| US-X02 | FR-A02, NFR-02 |
| US-X03 | Open access (no auth) |
