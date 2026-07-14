# Simulated Job Runs (MVP)

## Behavior

Runs are **simulated** — the API does not call Epicor, file watchers, Fabric, or Lake House loaders.

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/jobs/{job_id}/runs` | Paginated run history (newest first) |
| `POST /api/v1/jobs/{job_id}/runs/simulate` | Create and complete a simulated run |

### Simulate flow

1. Create `job_runs` row with status `queued`
2. Transition to `running`
3. Terminal status: `succeeded` (~85%) or `failed`
4. Paused jobs always fail with an explanatory message
5. Archived jobs cannot trigger new runs (history still visible)

### Run statuses

`queued` · `running` · `succeeded` · `failed`

## UI

- **Job detail → Runs** — timeline table with started/finished timestamps and message
- **Simulate run** — triggers the simulate endpoint and refreshes the list
- On **failed** runs: optional **Log problem** pre-fills code `RUN_FAILED` in the problems form below

## Post-MVP

- Background worker / scheduler
- Real connector execution and progress events
- Webhook or poll for long-running Fabric / Lake House jobs
