# Organization Job Handler

Internal console for data and integration teams to register, monitor, and troubleshoot **pipeline jobs** — not a ticketing or helpdesk app.

| Concept | Meaning |
|---------|---------|
| **Job** | A pipeline or sync the organization operates |
| **JobProblem** | Operational issue linked to a Job |
| **JobRun** | Execution attempt / status history (simulated in MVP) |
| **JobType** | Epicor → GD Warehouse · TXT → RPT · RPT → Fabric · Data Flow → Lake House |

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript |
| Backend | Python FastAPI + SQLAlchemy + Alembic + Pydantic |
| Database | PostgreSQL (local or [Neon](https://neon.tech)) |

---

## Monorepo layout

```
backend/     FastAPI app, models, services, Alembic migrations
frontend/    React UI, typed API client, pages
docs/        SRS, architecture, data model, API overview
AGENTS.md    AI / Cursor operating notes for this repo
```

---

## Prerequisites

- Node.js LTS
- Python 3.11+
- PostgreSQL accessible via `DATABASE_URL` (Neon pooled URL is fine)
- Git

---

## Quick start

### 1. Backend env

```bash
cd backend
copy .env.example .env
```

Edit `.env` and set a real `DATABASE_URL`. Never commit secrets.

```bash
pip install -r requirements.txt
```

Apply migrations **only after you review the SQL** (do not auto-run on production):

```bash
alembic upgrade head
```

Optional seed (dev):

```bash
python scripts/seed_jobs.py
```

Start the API:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 5000
```

| URL | Purpose |
|-----|---------|
| http://localhost:5000/docs | Swagger UI |
| http://localhost:5000/redoc | ReDoc |
| http://localhost:5000/api/v1/health | Health check |

### 2. Frontend env

```bash
cd frontend
copy .env.example .env
```

Default:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

```bash
npm install
npm run dev
```

Open http://localhost:5173 — the header should show **API connected** when the backend is up.

---

## Main UI routes

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/jobs` | Jobs list (search, filter, pagination) |
| `/jobs/templates` | Create from pipeline template |
| `/jobs/new` | Create job (`?template=` supported) |
| `/jobs/:id` | Job detail — problems + simulated runs |
| `/jobs/:id/edit` | Edit / archive |

---

## Access

- **Open full access** — no login, no Admin / Operator / Viewer roles
- Anyone who can open the app may create, edit, archive jobs; log/resolve problems; simulate runs
- Do not expose the API on an untrusted public network without a gateway you control
- Connectors to Epicor / Fabric / Lake House remain **simulated**
- Soft archive for jobs; schedule cron is metadata only

---

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/SRS.md](docs/SRS.md) | Requirements |
| [docs/user-stories.md](docs/user-stories.md) | User stories & acceptance criteria |
| [docs/architecture.md](docs/architecture.md) | System architecture |
| [docs/data-model.md](docs/data-model.md) | PostgreSQL model |
| [docs/api-overview.md](docs/api-overview.md) | API base path, errors, endpoint map |
| [docs/pipeline-templates.md](docs/pipeline-templates.md) | Templates (simulated vs integrated) |
| [docs/simulated-runs.md](docs/simulated-runs.md) | Job run simulation |
| [docs/integration-checklist.md](docs/integration-checklist.md) | Local QA checklist |
| [docs/git-workflow.md](docs/git-workflow.md) | Git branches, secrets, PR checklist |
| [docs/ci.md](docs/ci.md) | GitHub Actions build checks |
| [docs/smoke-step42.md](docs/smoke-step42.md) | Latest local API smoke notes |
| [AGENTS.md](AGENTS.md) | Cursor / agent workflow for this repo |
| [backend/README.md](backend/README.md) | Backend details |
| [frontend/README.md](frontend/README.md) | Frontend details |

Playbook PDF (Cursor steps): `Cursor_Steps_Job_Handler_Application.pdf`

---

## Domain language

Always use **Job**, **JobProblem**, **JobRun**. Never rename these to tickets, cases, or incidents in code or docs.

---

## License / ownership

Internal organization use. Keep credentials in local `.env` files only (gitignored).
