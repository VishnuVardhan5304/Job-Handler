import { useEffect, useState } from "react";
import { fetchHealth } from "../api/health";

type HealthState = "loading" | "ok" | "error";

export function HealthIndicator() {
  const [state, setState] = useState<HealthState>("loading");
  const [detail, setDetail] = useState("Checking API…");

  useEffect(() => {
    let active = true;

    fetchHealth()
      .then((data) => {
        if (!active) return;
        if (data.status === "ok" && data.database === "connected") {
          setState("ok");
          setDetail("API connected");
        } else {
          setState("error");
          setDetail("API unhealthy");
        }
      })
      .catch(() => {
        if (!active) return;
        setState("error");
        setDetail("API unreachable");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={`health health--${state}`} title={detail}>
      <span className="health__dot" aria-hidden="true" />
      <span className="health__label">{detail}</span>
    </div>
  );
}
