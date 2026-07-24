"""Discover local Windows Task Scheduler tasks (metadata only; skip sensitive)."""

from __future__ import annotations

import json
import platform
import re
import subprocess
from dataclasses import dataclass
from typing import Any

SENSITIVE_NAME_RE = re.compile(
    r"(password|passwd|secret|credential|private.?key|api.?key|token|wallet|connection.?string)",
    re.IGNORECASE,
)
SENSITIVE_ARG_RE = re.compile(
    r"(password|passwd|pwd|secret|token|api[_-]?key|connectionstring|connection.?string|"
    r"-p\s+\S+|/--password|/password)",
    re.IGNORECASE,
)

# Built-in OS task trees often contain machine/account internals — skip entirely.
SKIP_PATH_PREFIXES = (
    "\\Microsoft\\Windows\\",
    "\\Microsoft\\",
)


@dataclass(frozen=True)
class DiscoveredTask:
    task_path: str
    task_name: str
    folder: str
    enabled: bool
    state: str
    schedule_summary: str | None
    last_run_time: str | None
    last_task_result: int | None
    skip_reason: str | None = None


def is_sensitive_task(
    *,
    task_path: str,
    task_name: str,
    logon_type: str | None,
    action_execute: str | None,
    action_arguments: str | None,
) -> str | None:
    """Return a skip reason if the task or its fields look sensitive; else None."""
    combined_id = f"{task_path}{task_name}"
    if SENSITIVE_NAME_RE.search(combined_id):
        return "name_or_path_looks_sensitive"

    normalized = task_path.replace("/", "\\")
    while "\\\\" in normalized:
        normalized = normalized.replace("\\\\", "\\")
    if not normalized.startswith("\\"):
        normalized = "\\" + normalized

    for prefix in SKIP_PATH_PREFIXES:
        if normalized.upper().startswith(prefix.upper()):
            return "built_in_microsoft_task"

    if logon_type and str(logon_type).lower() == "password":
        # Password logon stores credentials with the task — never import.
        return "stores_password_logon"

    if action_arguments and SENSITIVE_ARG_RE.search(action_arguments):
        return "action_arguments_look_sensitive"

    if action_execute and SENSITIVE_ARG_RE.search(action_execute):
        return "action_execute_looks_sensitive"

    return None


def _normalize_task_path(folder: str, name: str) -> str:
    folder = (folder or "\\").replace("/", "\\")
    if not folder.endswith("\\"):
        folder = folder + "\\"
    if not folder.startswith("\\"):
        folder = "\\" + folder
    return f"{folder}{name}"


def _parse_last_result(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _schedule_summary(triggers: Any) -> str | None:
    if not triggers:
        return None
    if isinstance(triggers, str):
        text = triggers.strip()
        return text[:64] if text else None
    if isinstance(triggers, list):
        parts: list[str] = []
        for item in triggers:
            if isinstance(item, dict):
                parts.append(str(item.get("CimClass") or item.get("Enabled") or "Trigger"))
            else:
                parts.append(str(item))
        text = "; ".join(parts).strip()
        return text[:64] if text else None
    return str(triggers)[:64]


def discover_local_tasks() -> tuple[list[DiscoveredTask], list[DiscoveredTask]]:
    """
    Return (importable_tasks, skipped_tasks).

    Local Windows only. Uses PowerShell ScheduledTasks module — no secrets stored.
    """
    if platform.system() != "Windows":
        raise RuntimeError("Task Scheduler sync is only available on Windows")

    script = r"""
$ErrorActionPreference = 'Stop'
$tasks = @(Get-ScheduledTask | ForEach-Object {
  $t = $_
  $info = $null
  try { $info = Get-ScheduledTaskInfo -TaskName $t.TaskName -TaskPath $t.TaskPath } catch {}
  $action = $null
  if ($t.Actions) { $action = @($t.Actions)[0] }
  $principal = $t.Principal
  $triggerText = ''
  if ($t.Triggers) {
    $parts = @()
    foreach ($tr in @($t.Triggers)) {
      if ($null -ne $tr) {
        try { $parts += [string]$tr } catch {}
      }
    }
    $triggerText = ($parts -join '; ')
  }
  $state = ''
  try { $state = [string]$t.State } catch { $state = 'Unknown' }
  [PSCustomObject]@{
    TaskPath = [string]$t.TaskPath
    TaskName = [string]$t.TaskName
    State = $state
    LogonType = if ($principal -and $principal.LogonType) { [string]$principal.LogonType } else { $null }
    Execute = if ($action -and $action.Execute) { [string]$action.Execute } else { $null }
    Arguments = if ($action -and $action.Arguments) { [string]$action.Arguments } else { $null }
    LastRunTime = if ($info -and $info.LastRunTime) { $info.LastRunTime.ToString('o') } else { $null }
    LastTaskResult = if ($info) { $info.LastTaskResult } else { $null }
    TriggerSummary = $triggerText
  }
})
if ($tasks.Count -eq 0) { '[]' } else { $tasks | ConvertTo-Json -Depth 4 -Compress }
"""
    completed = subprocess.run(
        [
            "powershell",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            script,
        ],
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
    )
    if completed.returncode != 0:
        detail = (completed.stderr or completed.stdout or "PowerShell failed").strip()
        raise RuntimeError(f"Could not query Task Scheduler: {detail[:500]}")

    raw = (completed.stdout or "").strip()
    if not raw:
        return [], []

    payload = json.loads(raw)
    rows: list[dict[str, Any]]
    if isinstance(payload, dict):
        rows = [payload]
    elif isinstance(payload, list):
        rows = payload
    else:
        return [], []

    importable: list[DiscoveredTask] = []
    skipped: list[DiscoveredTask] = []

    for row in rows:
        folder = str(row.get("TaskPath") or "\\")
        name = str(row.get("TaskName") or "").strip()
        if not name:
            continue
        task_path = _normalize_task_path(folder, name)
        state = str(row.get("State") or "Unknown")
        enabled = state.lower() not in {"disabled"}
        skip = is_sensitive_task(
            task_path=task_path,
            task_name=name,
            logon_type=row.get("LogonType"),
            action_execute=row.get("Execute"),
            action_arguments=row.get("Arguments"),
        )
        # Never persist Execute/Arguments — only non-sensitive metadata.
        item = DiscoveredTask(
            task_path=task_path,
            task_name=name,
            folder=folder if folder.endswith("\\") else folder + "\\",
            enabled=enabled,
            state=state,
            schedule_summary=_schedule_summary(row.get("TriggerSummary")),
            last_run_time=row.get("LastRunTime"),
            last_task_result=_parse_last_result(row.get("LastTaskResult")),
            skip_reason=skip,
        )
        if skip:
            skipped.append(item)
        else:
            importable.append(item)

    return importable, skipped
