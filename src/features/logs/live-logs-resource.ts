import { defineQuery, queryScope } from "@askrjs/askr/data";
import type { OperationsLogPage } from "../../server/contracts";
import type { LogEntry } from "./logs-data";

export interface LiveLogSnapshot {
  readonly entries: readonly LogEntry[];
  readonly nextCursor: string | null;
  readonly sequence: number;
}

export const liveLogScope = queryScope("destroyer.logs");
function mapLogEntry(
  entry: OperationsLogPage["entries"][number],
  formatTime: (timestamp: string) => string,
): LogEntry {
  return {
    id: entry.id,
    time: formatTime(entry.timestamp),
    service: entry.service,
    route: entry.route,
    severity: entry.severity,
    latency: entry.latency,
    requestId: entry.requestId,
    message: entry.message,
  };
}

export function toLogEntry(entry: OperationsLogPage["entries"][number]): LogEntry {
  return mapLogEntry(entry, (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], { hour12: false }),
  );
}

function mapLogPageEntries(entries: OperationsLogPage["entries"]): LogEntry[] {
  if (entries.length === 0) return [];
  const formatter = new Intl.DateTimeFormat([], {
    hour12: false,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    // Keep Date's invalid-value display; Intl.format would throw for it.
    return Number.isNaN(date.getTime())
      ? date.toLocaleTimeString([], { hour12: false })
      : formatter.format(date);
  };
  return entries.map((entry) => mapLogEntry(entry, formatTime));
}

export async function fetchLiveLogs(
  _input: { principalId: string },
  { signal }: { signal: AbortSignal },
): Promise<LiveLogSnapshot> {
  const response = await fetch("/api/operations/logs?limit=80", {
    signal,
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(`Operations log request failed (${response.status}).`);
  const page = (await response.json()) as OperationsLogPage;
  return { ...page, entries: mapLogPageEntries(page.entries) };
}

export const liveLogQuery = defineQuery<{ principalId: string }, LiveLogSnapshot>({
  key: ({ principalId }) => liveLogScope.key("live", principalId),
  fetch: fetchLiveLogs,
});
