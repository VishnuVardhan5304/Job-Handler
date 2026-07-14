# Git workflow — Organization Job Handler

Safe collaboration for this monorepo. **Do not commit secrets.** Product terms stay **Job / JobProblem / JobRun** — not tickets.

---

## What must never be committed

| Item | Why |
|------|-----|
| `backend/.env`, `frontend/.env`, any `.env` (except `*.example`) | Neon URLs, passwords, tokens |
| `credentials.json`, `*.pem`, `*.key`, `.secrets/` | Credentials |
| `dist/`, `node_modules/`, `.venv/`, `__pycache__/` | Generated / local deps |
| Real production `DATABASE_URL` in docs or PRs | Leaks credentials into Git history |
| Force-push / rewritten history on shared `main` | Coordination risk |

Templates that **are** OK: `.env.example`, `.env.docker.example`, `.env.production.example` (placeholders only).

Ignore rules live in the root `.gitignore`. If you add a new secret file type, update that file in the same PR.

---

## Branch naming

| Pattern | Use |
|---------|-----|
| `Vardhan` (or your long-lived feature branch) | Day-to-day MVP work on this project |
| `feature/<short-slug>` | New capability (e.g. `feature/job-runs-ui`) |
| `fix/<short-slug>` | Bugfix |
| `docs/<short-slug>` | Docs-only |

Prefer short, lowercase slugs with hyphens. Avoid committing directly to a shared `main`/`master` if the team uses PRs.

---

## When to commit

- After a **thin slice** is working (one resource or one page), and you’ve smoke-checked it
- After docs/API README changes that complete an approved playbook step
- **Not** mid-broken migrate, and **not** with half-written env secrets staged

Suggested commit message style (why over what):

```
Add simulated JobRun API and job detail timeline

Explain soft-archive rules in create/update so lists stay consistent
```

---

## Human approval required

Do **not** run or commit without explicit approval:

- `alembic upgrade` / `downgrade` against shared or production DB
- Destructive SQL (`DROP`, `TRUNCATE`, unbound `DELETE`)
- `docker compose down -v` / volume wipes
- `git push --force`, `git reset --hard`, history rewrite
- Installing major new frameworks without an agreed dependency list

Safe to propose (still show the command): `uvicorn`, `npm run dev`, `pytest`, `npm test`, draft `alembic revision --autogenerate` (review SQL before apply).

---

## Pull request checklist

Before opening a PR:

1. [ ] No `.env` or credentials in the diff (`git status` / PR file list)
2. [ ] Branch is based on the agreed base (`main` or `Vardhan` as your team uses)
3. [ ] Short summary: what changed for Jobs / JobProblems / JobRuns
4. [ ] Test plan: smoke checklist or steps in `docs/integration-checklist.md`
5. [ ] Schema change? Call it out and wait for human OK before migrate
6. [ ] Domain language OK (no ticket/case/incident renaming)
7. [ ] CI green on the PR (frontend build + backend import) — see [ci.md](ci.md)

Example PR body:

```markdown
## Summary
- …

## Test plan
- [ ] API health OK
- [ ] Jobs list / create / archive
- [ ] Job problems create / resolve
- [ ] Simulate run on job detail
```

Use `gh pr create` when the team wants a GitHub PR; do not push or open a PR unless asked.

---

## Related

- Root setup: [README.md](../README.md)
- Agent rules: [AGENTS.md](../AGENTS.md)
- API overview: [api-overview.md](api-overview.md)
