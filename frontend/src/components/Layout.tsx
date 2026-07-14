import { NavLink, Outlet } from "react-router-dom";
import { HealthIndicator } from "./HealthIndicator";

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__title">Job Handler</span>
          <span className="app-header__subtitle">Organization pipeline console</span>
        </div>
        <nav className="app-nav" aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
            Dashboard
          </NavLink>
          <NavLink to="/jobs" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Jobs
          </NavLink>
        </nav>
        <HealthIndicator />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
