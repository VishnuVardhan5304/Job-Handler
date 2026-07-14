import type { ReactNode } from "react";

interface LoadingBlockProps {
  label?: string;
  rows?: number;
}

export function LoadingBlock({ label = "Loading…", rows = 3 }: LoadingBlockProps) {
  return (
    <div className="loading-block" aria-busy="true" aria-live="polite">
      <p className="loading-block__label">{label}</p>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton loading-block__row" />
      ))}
    </div>
  );
}

interface ErrorPanelProps {
  title: string;
  message: string;
  onRetry?: () => void;
  action?: ReactNode;
}

export function ErrorPanel({ title, message, onRetry, action }: ErrorPanelProps) {
  return (
    <div className="error-panel" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          Retry
        </button>
      ) : null}
      {action}
    </div>
  );
}
