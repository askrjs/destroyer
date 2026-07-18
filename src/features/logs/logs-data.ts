export type LogSeverity = "debug" | "info" | "warning" | "error";

export interface LogEntry {
  readonly id: string;
  readonly time: string;
  readonly service: string;
  readonly route: string;
  readonly severity: LogSeverity;
  readonly latency: number;
  readonly requestId: string;
  readonly message: string;
}

export function getBadgeVariant(severity: LogSeverity) {
  if (severity === "error") return "danger";
  if (severity === "warning") return "warning";
  if (severity === "debug") return "secondary";
  return "info";
}

export function getSeverityTone(severity: LogSeverity) {
  if (severity === "error") return "danger";
  if (severity === "warning") return "warning";
  if (severity === "debug") return "muted";
  return "info";
}
