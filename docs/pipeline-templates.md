# Pipeline Job Templates

## MVP behavior

Templates are **metadata presets** — they pre-fill job type, source → target, schedule, and a JSON `config` stub. They do **not** invoke external systems.

| Template | Job type | Integration (MVP) |
|----------|----------|-------------------|
| Epicor → GD Warehouse Sync | `EPICOR_GD_WH_SYNC` | **Simulated** — no Epicor API |
| TXT → RPT Tables | `TXT_TO_RPT` | **Simulated** — no file drop watcher |
| RPT → Fabric (Data Flow) | `RPT_TO_FABRIC` | **Simulated** — no Fabric API |
| Data Flow → Lake House | `DATAFLOW_TO_LAKEHOUSE` | **Simulated** — no Lake House loader |

## API

- `GET /api/v1/jobs/templates` — list templates with `integration_mode: simulated`

## UI entry points

- Dashboard → **From template**
- `/jobs/templates` — template gallery
- `/jobs/new?template={id}` — create form pre-filled from template

## Post-MVP (not built)

- Real Epicor connector, Fabric ingestion, Lake House loaders
- `integration_mode: integrated` with worker/scheduler execution
