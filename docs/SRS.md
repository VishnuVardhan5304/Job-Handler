# Software Requirements Specification (SRS)
# Organization Job Handler

**Version:** 0.1 (MVP draft)  
**Stack:** React + FastAPI + PostgreSQL  
**Status:** Awaiting approval before architecture

---

## 1. Purpose

Provide an internal **Organization Job Handler** console for data and integration teams to register, monitor, and troubleshoot **pipeline jobs** and **job problems** ù not a ticketing or helpdesk system.

Example pipelines the system must model from day one:

| Job type | Source ? Target | Description |
|----------|-----------------|-------------|
| Epicor GD Warehouse Sync | Epicor ? GD Warehouse | ERP data synchronized into GD warehouse |
| TXT to RPT | TXT ? RPT | Text/source files loaded into reporting tables |
| RPT to Fabric | RPT ? Fabric | Reporting data pushed into Microsoft Fabric (Data Flow) |
| Data Flow to Lake House | Data Flow ? Lake House | Data flow output landed in the lake house |

---

## 2. Scope

### In scope (MVP)

- **Job CRUD** ù create, read, update, archive jobs
- **Job Problem CRUD** ù log, list, update, resolve problems linked to a job
- **Dashboard** ù counts by status and job type; recent jobs; unresolved problems
- **Jobs list** ù search, filter by job type and status, sort, pagination
- **Four pipeline job types** ù first-class enums/templates with source/target defaults
- **Job run status (simulated)** ù lightweight run history with manual ùsimulate runù; no real orchestrator
- **PostgreSQL persistence** ù Neon or compatible Postgres (aligned with sibling projects)
- **REST API** ù versioned backend consumed by React UI

### Out of scope (MVP / non-goals)

- Real Epicor, Fabric, or Lake House connectors
- Production job scheduler / worker queue (Celery, RQ, Airflow, etc.)
- Multi-tenant organizations
- Authentication / SSO / RBAC (intentionally not used ù open full access)
- Email/Slack alerting
- Audit log beyond basic timestamps
- Mobile-native app

---

## 3. Access model

| Aspect | Decision |
|--------|----------|
| **Who can use the app** | Anyone who can open the UI or reach the API |
| **Roles** | **None** ù no Admin / Operator / Viewer |
| **Login** | **None** ù full access to all Job / JobProblem / JobRun actions |
| **Auth / RBAC** | **Out of scope** for this product as currently shipped |

Do not introduce permission-gated screens or API checks for roles.

---

## 4. Functional requirements

### 4.1 Jobs

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-J01 | Create a job with name, job type, source system, target system, status, optional schedule (cron string), optional config (JSON) | MUST |
| FR-J02 | List jobs with pagination | MUST |
| FR-J03 | Search jobs by name | MUST |
| FR-J04 | Filter jobs by job type and status | MUST |
| FR-J05 | Sort jobs by name, updated time, status | MUST |
| FR-J06 | View a single job with full detail | MUST |
| FR-J07 | Update job fields | MUST |
| FR-J08 | Archive a job (soft delete); archived jobs hidden from default list | MUST |
| FR-J09 | Seed or create-from-template for the four pipeline job types | MUST |
| FR-J10 | When job type is selected on create, suggest default source/target for that pipeline | SHOULD |

**Job status (MVP):** `draft`, `active`, `paused`, `archived`  
**Job types (MVP):** `EPICOR_GD_WH_SYNC`, `TXT_TO_RPT`, `RPT_TO_FABRIC`, `DATAFLOW_TO_LAKEHOUSE`

### 4.2 Job problems

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-P01 | Create a problem linked to a job: severity, code, message, occurred time, optional metadata | MUST |
| FR-P02 | List problems for a job | MUST |
| FR-P03 | List all problems with filter by severity and unresolved-only | MUST |
| FR-P04 | Update problem details | MUST |
| FR-P05 | Resolve a problem (set resolved timestamp) | MUST |
| FR-P06 | Create a problem from a failed simulated job run | SHOULD |

**Severity (MVP):** `low`, `medium`, `high`, `critical`

### 4.3 Job runs (simulated)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-R01 | Record a job run with status transition: queued ? running ? succeeded or failed | SHOULD |
| FR-R02 | Show latest run and simple timeline on job detail | SHOULD |
| FR-R03 | ùSimulate runù action on job detail (no external system call) | SHOULD |

**Run status (MVP):** `queued`, `running`, `succeeded`, `failed`

### 4.4 Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-D01 | Display total jobs and counts grouped by status | MUST |
| FR-D02 | Display counts grouped by job type | MUST |
| FR-D03 | Show recent jobs (e.g. last 10 updated) | MUST |
| FR-D04 | Show count of unresolved problems | MUST |
| FR-D05 | Primary action: navigate to create job | MUST |

### 4.5 API

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-A01 | REST API under `/api/v1` | MUST |
| FR-A02 | Consistent JSON error responses with detail and code | MUST |
| FR-A03 | OpenAPI documentation via FastAPI `/docs` | MUST |
| FR-A04 | CORS configured for local React dev origin | MUST |

---

## 5. Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | API list endpoints respond within 2s for up to 10k jobs (indexed queries) |
| NFR-02 | UI shows loading, empty, and error states on all data views |
| NFR-03 | No secrets in source control; use environment templates |
| NFR-04 | Schema changes via reviewed migrations only |
| NFR-05 | Code organized in monorepo: frontend and backend separated |
| NFR-06 | Domain terms consistent across API and UI (Job, JobProblem, JobRun ù not ticket) |

---

## 6. Data entities (logical)

### Job

- Identifier, name, job type, source system, target system
- Status, optional schedule cron, optional config JSON
- Created at, updated at, archived at (nullable)

### JobProblem

- Identifier, foreign key to job
- Severity, code, message, metadata JSON
- Occurred at, resolved at (nullable)
- Created at, updated at

### JobRun (MVP optional table)

- Identifier, foreign key to job
- Status, started at, finished at, message (nullable)
- Created at

---

## 7. Integrations (MVP)

| System | MVP behavior |
|--------|----------------|
| PostgreSQL | Primary datastore |
| Epicor | Metadata only; no live API |
| Microsoft Fabric | Metadata only; no live API |
| Lake House | Metadata only; no live API |
| External scheduler | None; simulate run via UI |

---

## 8. Acceptance test ideas

| FR | Test idea |
|----|-----------|
| FR-J01 | Given valid job payload, when POST create, then job returned with correct type and source/target |
| FR-J04 | Given jobs of mixed types, when filter by `TXT_TO_RPT`, then only matching jobs returned |
| FR-J08 | Given active job, when archive, then job absent from default list but retrievable by id with archived status |
| FR-P01 | Given existing job, when create problem, then problem appears on job detail with unresolved state |
| FR-P05 | Given open problem, when resolve, then resolved timestamp set and excluded from unresolved filter |
| FR-J09 | Given template for Epicor sync, when create from template, then source=Epicor and target=GD Warehouse |
| FR-D04 | Given 3 unresolved problems, when load dashboard, then unresolved count shows 3 |
| FR-R03 | Given active job, when simulate run, then run record created and status progresses to terminal state |

---

## 9. Assumptions (locked for MVP unless changed)

1. Single organization; no multi-tenant
2. **Open full access** ó no authentication, no Admin / Operator / Viewer roles
3. Pipeline connectivity simulated only
4. Soft archive for jobs (not hard delete)
5. PostgreSQL hosted on Neon or equivalent
6. Job runs included as lightweight simulation

---

## 10. Open items for later phases

- Real Epicor / Fabric / Lake House connectors
- Production scheduler and worker infrastructure
- Alerting and audit trail
- CI/CD and Docker deployment (covered in later build steps)

---

## 11. Approval

This document must be approved before **architecture design (Phase 2, Step 9)**.
