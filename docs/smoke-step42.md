# Step 42 — Smoke walkthrough notes

**Date:** 2026-07-14  
**Branch context:** `feature/phase7-docs-ci-hardening` (local API + Neon)

## Result: API smoke **PASS**

| Area | Result |
|------|--------|
| Health (`/api/v1/health`) | OK — database connected |
| Swagger `/docs`, ReDoc, OpenAPI JSON | 200 |
| Templates (4 pipelines) | OK |
| Jobs list / create / get / patch / archive | OK |
| Job problems create / list / resolve | OK |
| Simulate run + list runs | OK |
| Archived job blocks simulate (422 + `code`) | OK |
| 404 error shape `{detail, code}` | OK |
| Root README + API overview paths | Present |
| Frontend `npm run build` | PASS |

## Gotcha found (environment)

A leftover CI placeholder `DATABASE_URL` (`127.0.0.1` / user `ci`) in the shell overrode `backend/.env` and caused health/DB 500s. Cleared env vars and restarted uvicorn so Neon from `.env` loaded. **Do not leave CI placeholder env vars set when running local smoke.**

## Not exercised in this pass (manual / deferred)

- Browser UI: CORS, “API connected” badge, toasts, archive modal UX
- Edit-job form end-to-end in the browser
- GitHub Actions green on the open PR (PR still needs `gh auth login` or web compare link)
- Frontend unreachable when backend stopped (error UI)

## README / Swagger alignment

Local start paths in root README (`uvicorn` port 5000, `/docs`, frontend `5173`) match the live smoke run.
