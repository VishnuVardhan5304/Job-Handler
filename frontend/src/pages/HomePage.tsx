export function HomePage() {
  return (
    <section className="panel">
      <h1>Jobs Console</h1>
      <p>
        Frontend scaffold is ready. Dashboard, job list, and problem views will be added in the
        next steps.
      </p>
      <p className="muted">
        API base: {import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1"}
      </p>
    </section>
  );
}
