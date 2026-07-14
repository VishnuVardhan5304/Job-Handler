# Continuous Integration — Job Handler

Lightweight GitHub Actions checks. **CI is a safety net**, not a replacement for the [integration checklist](integration-checklist.md).

## What runs

Workflow: `.github/workflows/ci.yml`

| Job | Checks |
|-----|--------|
| **Frontend build** | `npm ci` + `npm run build` (TypeScript + Vite) |
| **Backend import** | `pip install`, `compileall`, import FastAPI app |

Triggers: pushes and pull requests to `main`, `master`, or `Vardhan`.

## What does *not* run

- No connection to production Neon or any real database
- No `alembic upgrade` / migrations
- No Docker images
- No e2e browser tests
- No deploys

CI uses a **placeholder** `DATABASE_URL` so settings load without secrets. That URL is not a live database.

## Manual smoke still required

Before merging meaningful Job / JobProblem / JobRun changes, run local checks from `docs/integration-checklist.md` (API health, CRUD, problems, simulate run).

## Secrets policy

- Never put Neon passwords, tokens, or production URLs in workflow YAML
- Prefer GitHub Actions secrets only if a future job truly needs them — and keep names non-sensitive in logs

## Related

- [git-workflow.md](git-workflow.md) — branches, PRs, never-commit list
- [api-overview.md](api-overview.md) — API docs
- Root [README.md](../README.md) — local run
