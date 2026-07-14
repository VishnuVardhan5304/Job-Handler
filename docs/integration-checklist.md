# Integration QA Checklist
# Job Handler — local dev (frontend + backend + Neon)

## Environment

- [ ] Backend `.env` has valid `DATABASE_URL` (Neon pooled URL) and `CLIENT_URL=http://localhost:5173`
- [ ] Frontend `.env` has `VITE_API_URL=http://localhost:5000/api/v1`
- [ ] Backend running: `uvicorn app.main:app --reload --port 5000`
- [ ] Frontend running: `npm run dev` → `http://localhost:5173`
- [ ] Header shows **API connected** (health check OK)

## CORS

- [ ] Dashboard loads without browser CORS errors in DevTools console
- [ ] Works on `http://localhost:5173` and `http://127.0.0.1:5173` (dev mode)

## Jobs flow

- [ ] Dashboard shows job counts and recent jobs from API
- [ ] Jobs list: search, filter by type/status, pagination
- [ ] Create job: pipeline defaults fill source/target; success toast; lands on detail
- [ ] Edit job: save changes; success toast
- [ ] Archive job: confirmation modal; removed from default list; visible with “Include archived”

## Problems flow

- [ ] Job detail: log problem (severity, code, message)
- [ ] Unresolved filter shows new problem
- [ ] Resolve problem removes it from unresolved list
- [ ] Toggle “Unresolved only” shows resolved history

## Simulated runs

- [ ] Job detail → Runs section loads history
- [ ] **Simulate run** creates a new run (succeeded or failed)
- [ ] Failed run offers **Log problem** with code `RUN_FAILED`
- [ ] Archived job: runs history visible; simulate button hidden

## Continuous integration

- [ ] PR CI green (frontend build + backend import) when using GitHub — see `docs/ci.md`
- CI does **not** replace local smoke of Jobs / Problems / Runs against your DB

## Error handling

- [ ] Stop backend → UI shows unreachable/API error (not blank screen)
- [ ] Invalid create form → field errors or toast, no silent failure
- [ ] 404 job URL → “Job not found” empty state

## API contract spot-check

- [ ] `GET /api/v1/health` → `{ status: "ok", database: "connected" }`
- [ ] Job enums in UI match API: `EPICOR_GD_WH_SYNC`, `TXT_TO_RPT`, `RPT_TO_FABRIC`, `DATAFLOW_TO_LAKEHOUSE`
- [ ] Error JSON shape: `{ detail, code, fields? }`
