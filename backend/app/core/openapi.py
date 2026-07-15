"""OpenAPI / Swagger metadata for Job Handler API."""

API_TITLE = "Organization Job Handler API"
API_VERSION = "0.1.0"

API_DESCRIPTION = """
REST API for the **Organization Job Handler** — pipeline Jobs, JobProblems, and simulated JobRuns.

**Base path:** `/api/v1`

**Domain:** Job · JobProblem · JobRun (not tickets / helpdesk).

**MVP auth:** None — open full access; no roles. Do not expose publicly without a trusted network boundary.

**Error shape:** `{ "detail": "...", "code": "...", "fields": {} }`

**Docs guide:** See `docs/api-overview.md` in the repository for endpoint maps and local run steps.

### Pipeline job types
- `EPICOR_GD_WH_SYNC` — Epicor → GD Warehouse
- `TXT_TO_RPT` — TXT → RPT
- `RPT_TO_FABRIC` — RPT → Fabric
- `DATAFLOW_TO_LAKEHOUSE` — Data Flow → Lake House

### Simulated vs integrated
Templates and runs are **simulated** in MVP (metadata + fake execution). Live Epicor / Fabric / Lake House connectors are post-MVP.
"""

OPENAPI_TAGS = [
    {
        "name": "health",
        "description": "Liveness and database connectivity.",
    },
    {
        "name": "jobs",
        "description": "Pipeline job catalog — CRUD, soft archive, and job templates.",
    },
    {
        "name": "problems",
        "description": "Global JobProblem list, get, update, and resolve.",
    },
    {
        "name": "job-problems",
        "description": "JobProblem nested under a Job — list and create for one job.",
    },
    {
        "name": "job-runs",
        "description": "Simulated JobRun history and trigger (no live connectors).",
    },
    {
        "name": "job-solutions",
        "description": "Solutions for JobProblems; adding a solution closes the problem.",
    },
]
