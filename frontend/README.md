# Job Handler — Frontend

React + Vite + TypeScript Jobs Console.

## Planned layout

```
src/
  pages/              # Dashboard, JobsList, JobDetail, CreateJob
  features/
    jobs/             # Job forms, hooks, types
    problems/         # Problem forms, resolve flow
  components/         # Badges, table, modal, toast
  api/                # Typed HTTP client
```

## Setup

1. Copy `.env.example` to `.env` if you need to override the API URL
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Ensure the backend API is running on port 5000

## Verify

- Open `http://localhost:5173`
- Header should show **API connected** when backend health is OK

## Routes

- `/` — Dashboard
- `/jobs` — Jobs list
- `/jobs/templates` — Create from template
- `/jobs/new` — Create job
- `/jobs/:id` — Job detail (problems + simulated runs)
- `/jobs/:id/edit` — Edit / archive job

See the [root README](../README.md) for full local setup.
