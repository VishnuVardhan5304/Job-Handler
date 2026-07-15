# API Overview — Organization Job Handler

**Version:** 0.1.0  
**Base path:** `/api/v1`  
**Interactive docs:** Swagger UI + ReDoc (see [Run locally](#run-locally))

This API manages **Jobs** (pipeline catalog), **JobProblems** (operational issues), and **JobRuns** (simulated execution history). It is not a ticketing or helpdesk API.

---

## Auth (open access)

**No authentication and no roles.** Anyone who can render the UI or call the API has **full access** to Jobs, JobProblems, JobRuns, and templates. Do not expose publicly without a network boundary you trust.

---

## Domain objects

| Resource | Meaning |
|----------|---------|
| **Job** | A registered pipeline (Epicor→GD WH, TXT→RPT, RPT→Fabric, Data Flow→Lake House) |
| **JobProblem** | An operational issue linked to a Job |
| **JobRun** | A simulated run record (MVP — no live connectors) |
| **JobTemplate** | Metadata preset for creating a Job |

---

## Error shape

All application errors use:

```json
{
  "detail": "Human-readable message",
  "code": "ERROR_CODE",
  "fields": { "field_name": "why it failed" }
}
```

| HTTP | When |
|------|------|
| **404** | Resource not found (`NOT_FOUND`) |
| **422** | Validation (`VALIDATION_ERROR`) — often includes `fields` |
| **500** | Unexpected failure (`INTERNAL_ERROR`) — no stack traces to clients |

---

## Pagination

List endpoints return:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 20,
  "pages": 0
}
```

Common query params: `page` (default 1), `page_size` (default 20, max 100).

---

## Endpoint map

### Health

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` or `/api/v1/health` | Liveness + DB connectivity |

### Jobs

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/jobs` | List/search/filter (archived hidden unless `include_archived=true`) |
| POST | `/api/v1/jobs` | Create job (cannot create as `archived`) |
| GET | `/api/v1/jobs/templates` | Four pipeline templates (simulated integration) |
| GET | `/api/v1/jobs/{job_id}` | Get one job |
| PATCH | `/api/v1/jobs/{job_id}` | Update job (not archived) |
| POST | `/api/v1/jobs/{job_id}/archive` | Soft-archive |

### Job problems

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/problems` | Global problem list |
| GET | `/api/v1/problems/{problem_id}` | Get one problem |
| PATCH | `/api/v1/problems/{problem_id}` | Update unresolved problem |
| POST | `/api/v1/problems/{problem_id}/resolve` | Set `resolved_at` |
| GET | `/api/v1/jobs/{job_id}/problems` | Problems for a job (history OK if archived) |
| POST | `/api/v1/jobs/{job_id}/problems` | Log a problem (blocked if job archived) |

### Job runs (simulated)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/jobs/{job_id}/runs` | Run history |
| POST | `/api/v1/jobs/{job_id}/runs/simulate` | Queued → running → succeeded/failed (no live connectors) |

---

## Example — create a job

`POST /api/v1/jobs`

```json
{
  "name": "Nightly TXT to RPT Load",
  "job_type": "TXT_TO_RPT",
  "status": "active",
  "schedule_cron": "0 3 * * *"
}
```

Source/target default from job type when omitted.

## Example — log a problem

`POST /api/v1/jobs/{job_id}/problems`

```json
{
  "severity": "high",
  "code": "SYNC_TIMEOUT",
  "message": "Watermark sync exceeded 30 minutes"
}
```

## Example — simulate a run

`POST /api/v1/jobs/{job_id}/runs/simulate`  
No body. Response includes `status` (`succeeded` or `failed`) and `message`.

---

## Related docs

- Pipeline templates (simulated vs integrated): `docs/pipeline-templates.md`
- Simulated runs: `docs/simulated-runs.md`
- Data model: `docs/data-model.md`
- Integration QA: `docs/integration-checklist.md`

---

## Run locally

```bash
# Terminal 1 — API (from backend/)
uvicorn app.main:app --reload --port 5000
```

Then open:

- Swagger UI: http://localhost:5000/docs  
- ReDoc: http://localhost:5000/redoc  
- OpenAPI JSON: http://localhost:5000/openapi.json  
- Health: http://localhost:5000/api/v1/health  

Frontend (optional): `VITE_API_URL=http://localhost:5000/api/v1` and `npm run dev` in `frontend/`.

Ensure `backend/.env` has a valid `DATABASE_URL` (local or Neon). Never commit real secrets.
