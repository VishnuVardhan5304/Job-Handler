# Job Handler — Agent Guide

## AI operating manual (model & mode policy)

Use Cursor deliberately for this monorepo (`/backend` FastAPI, `/frontend` React+Vite+TS, PostgreSQL). Prefer **thin slices** and human approval between steps.

### Model policy (by task type)

| Task | Prefer | Why |
|------|--------|-----|
| Planning / architecture / SRS / data model | Stronger reasoning model (Plan mode) | Cross-cutting decisions; fewer rewrites |
| Implementation of one agreed slice | Capable coding model (Agent mode) | Multi-file edits with a fixed file/scope list |
| Refactor / rename / single-file polish | Fast or inline-capable model (Inline Edit) | Surgical diffs; less context drift |
| Quick Q&A ("what does this do?") | Fast model (Chat) | Low cost; no repo mutation |

**Rule of thumb:** If the answer changes folder layout, schema, or public API contracts ? Plan first. If the change is one resource/page already approved ? Agent. If the change is one symbol or one file ? Inline Edit.

### Features to keep on (minimal useful set)

- **Project rules / AGENTS.md** — durable stack + domain constraints
- **Codebase indexing** — so Agent finds Jobs / JobProblems correctly
- **Terminal** — for install, migrate, test — **only with review** on risky commands
- **Git awareness** — review diffs before commit

Avoid over-automation: do not enable "apply everything" or unattended long Agent runs across the whole monorepo.

### When NOT to let Agent auto-run terminal commands

Do **not** auto-run (require explicit human approval) for:

- `alembic upgrade` / `downgrade` / any migration apply
- `DROP`, `TRUNCATE`, `DELETE FROM` without WHERE, or schema destructive SQL
- `docker compose down -v` / volume wipes
- Production `DATABASE_URL` or any remote DB connection
- `git push --force`, `git reset --hard`, rewriting history
- Bulk `npm publish` / deploying CI secrets
- Installing major new frameworks without an approved dependency list

Safe to propose (still show the command first): `uvicorn`, `npm run dev`, `pytest`, `npm test`, `alembic revision --autogenerate` **as a draft** (review migration SQL before upgrade).

### Default workflow for Job Handler

1. **Plan** — architecture, SRS, ER, API contract
2. **Human approves** — scope, non-goals, acceptance criteria
3. **Agent** — one thin slice (e.g. Jobs CRUD only)
4. **Inline** — naming, types, small fixes
5. **Human reviews diff** — then next slice

### Domain reminder (do not drift)

This is an **Organization Job Handler**, not a ticketing app. Core nouns: `Job`, `JobType`, `JobProblem`, `JobRun`, pipelines (Epicor?GD WH, TXT?RPT, RPT?Fabric, Data Flow?Lake House).

---

## Coding standards (summary)

### Stack

React + Vite + TypeScript on the front end; FastAPI + SQLAlchemy + Alembic + Pydantic on the back end; PostgreSQL for persistence.

### Naming

- Use **Job**, **JobProblem**, **JobRun** — never ticket/case/incident
- JobTypes: Epicor?GD Warehouse, TXT?RPT, RPT?Fabric, Data Flow?Lake House
- Backend layers: router ? service ? repository; no business logic in routers

### API

- Versioned under `/api/v1`
- Consistent error JSON: `{ detail, code, fields? }`
- List endpoints support pagination, filters, and search

### Frontend

- Typed API client; shared types with backend schemas
- Every data view: loading + empty + error states
- Reusable badges for status and job type

### Approval gates

Ask before: new top-level folders, schema changes, major new dependencies, running migrations.
