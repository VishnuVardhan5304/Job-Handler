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

## Routes (planned)

- `/` — Dashboard (Step 19)
- `/jobs` — Jobs list (Step 20)
- `/jobs/new` — Create job (Step 21)
- `/jobs/:id` — Job detail (Step 23)
- `/jobs/:id/edit` — Edit job (Step 22)
