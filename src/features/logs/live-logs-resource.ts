import { defineQuery, queryScope } from "@askrjs/askr/data";
import type { OperationsLogPage } from "../../server/contracts";
import type { LogEntry } from "./logs-data";

export interface LiveLogSnapshot {
  readonly entries: readonly LogEntry[];
  readonly nextCursor: string | null;
  readonly sequence: number;
}

export const liveLogScope = queryScope("destroyer.logs");
export function toLogEntry(entry: OperationsLogPage["entries"][number]): LogEntry {
  return {
    id: entry.id,
    time: new Date(entry.timestamp).toLocaleTimeString([], { hour12: false }),
    service: entry.service,
    route: entry.route,
    severity: entry.severity,
    latency: entry.latency,
    requestId: entry.requestId,
    message: entry.message,
  };
}

export async function fetchLiveLogs({ signal }: { signal: AbortSignal }): Promise<LiveLogSnapshot> {
  const response = await fetch("/api/operations/logs?limit=80", {
    signal,
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(`Operations log request failed (${response.status}).`);
  const page = (await response.json()) as OperationsLogPage;
  return { ...page, entries: page.entries.map(toLogEntry) };
}

export const liveLogQuery = defineQuery<{ principalId: string }, LiveLogSnapshot>({
  key: ({ principalId }) => liveLogScope.key("live", principalId),
  fetch: fetchLiveLogs,
});
