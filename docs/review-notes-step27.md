# Step 27 — Code review & consistency notes

**Date:** 2026-07-14  
**Scope:** MVP through Step 26 (Jobs, Problems, Templates, Simulated Runs)

---

## Verdict

MVP structure is sound: routers stay thin, schemas/types align, and product UI uses Job / JobProblem / JobRun language. Several consistency bugs were fixed in this step; remaining work is polish, tests, and post-MVP features.

---

## Fixed in Step 27

| Issue | Change |
|-------|--------|
| Archived jobs blocked **listing** problems | `list_for_job` only requires job exists; create still blocked when archived |
| Create/update could set `status=archived` without `archived_at` | Backend rejects archived on create/update; create form omits Archived option |
| Dashboard `totalJobs` used page length | Uses `jobsResponse.total`; chip counts still sample-based (documented) |
| User stories said “incident” | Reworded to job problem language |
| Unknown `?template=` silent | Banner + link to templates gallery |
| Empty templates list | Empty state on templates page |
| `HTTPException` returned `{detail}` only | Handler now returns `{detail, code}` |
| Unused `HomePage` | Removed; `RunStatusBadge` added to component barrel |

---

## Looks good (no change)

- Domain nouns in product code (no ticket/case/helpdesk UI copy)
- API layers: router → service → repository
- Frontend pages generally have loading / empty / error paths
- Job / Problem / Run schema fields match frontend types

---

## Deferred (later steps)

| Item | Suggested step |
|------|----------------|
| Automated API + UI tests | Step 29–30 |
| Shared `toQuery` / date-format helpers | Step 28 refactor |
| Dedicated dashboard stats endpoint (accurate status/type chips) | Phase 7 / roadmap |
| Hide `/dev/ui` from primary nav | Step 28 or packaging |
| Adopt `LoadingBlock` / `ErrorPanel` across pages or remove | Step 28 |
| OpenAPI-generated shared types | Phase 7 |
| Live connectors / auth / CI / Docker | Later playbook phases |

---

## Manual smoke (recommended)

1. Open an **archived** job → Problems history loads; Add problem / Simulate run hidden or blocked
2. Create job → status dropdown has no Archived; archive via Edit only
3. Dashboard total matches jobs list total (with same include-archived filter)
4. Visit `/jobs/new?template=not-a-real-id` → warning banner appears
