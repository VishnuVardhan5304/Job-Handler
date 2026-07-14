# Job Handler — Backend

FastAPI REST API for Organization Job Handler.

## Planned layout

```
app/
  main.py           # App entry (Step 13)
  api/v1/           # Routers: jobs, problems, runs, dashboard
  core/             # Config, database session, dependencies
  models/           # SQLAlchemy models
  schemas/          # Pydantic request/response
  services/         # Business logic
  repositories/     # Database access
alembic/            # Migrations (Step 12)
tests/              # pytest (Phase 6)
```

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` (Neon pooled URL)
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Apply migrations (after review):
   ```bash
   alembic upgrade head
   ```
4. Run the API:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 5000
   ```

## Verify

- Health: `GET http://localhost:5000/health` or `GET http://localhost:5000/api/v1/health`
- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`
- OpenAPI JSON: `http://localhost:5000/openapi.json`

## API documentation

- Developer overview (endpoint map, errors, examples): [`docs/api-overview.md`](../docs/api-overview.md)
- Architecture notes: [`docs/architecture.md`](../docs/architecture.md)

## API base

`/api/v1` — Jobs, JobProblems, JobRuns, Templates. No auth in MVP.
