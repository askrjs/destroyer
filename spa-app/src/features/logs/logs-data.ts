export type LogSeverity = "debug" | "info" | "warning" | "error";

export type LogEntry = {
  id: string;
  time: string;
  service: string;
  route: string;
  severity: LogSeverity;
  latency: number;
  requestId: string;
  message: string;
};

const LIVE_LOG_LIMIT = 80;
const LIVE_LOG_START_INDEX = 9600;

const services = ["router", "theme", "auth", "billing", "docs", "settings"] as const;
const routes = [
  "/docs",
  "/docs/components",
  "/settings/security",
  "/settings/preferences",
  "/profile/activity",
  "/contact",
] as const;
const messages = [
  "Route transition committed without remounting shell state.",
  "Theme token read completed from local storage.",
  "Virtualized viewport retained its scroll anchor.",
  "Security activity table refreshed from local cache.",
  "Profile route badge metadata resolved for hover details.",
  "Settings form state synchronized with route segment.",
  "Docs rail collapsed state restored before first paint.",
  "Contact workflow queued toast confirmation.",
] as const;

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

export function createLiveLogWindow(sequence: number, timestamp: number): LogEntry[] {
  const snapshotStart = LIVE_LOG_START_INDEX + sequence * LIVE_LOG_LIMIT;

  return Array.from({ length: LIVE_LOG_LIMIT }, (_, index) =>
    createLiveLogEntry(snapshotStart + index, timestamp - index * 1000),
  );
}

function getSeverity(index: number): LogSeverity {
  if (index % 29 === 0) return "error";
  if (index % 11 === 0) return "warning";
  if (index % 5 === 0) return "debug";
  return "info";
}

function createLogEntry(index: number): LogEntry {
  const service = services[index % services.length];
  const route = routes[(index * 2) % routes.length];
  const minute = String(58 - (index % 55)).padStart(2, "0");
  const second = String((index * 7) % 60).padStart(2, "0");

  return {
    id: `evt-${String(84720 + index)}`,
    time: `09:${minute}:${second}`,
    service,
    route,
    severity: getSeverity(index),
    latency: 38 + ((index * 17) % 220),
    requestId: `req_${(index * 7919).toString(16).padStart(6, "0")}`,
    message: messages[index % messages.length],
  };
}

function formatLocalLogTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${hour}:${minute}:${second}`;
}

function createLiveLogEntry(index: number, timestamp: number): LogEntry {
  return {
    ...createLogEntry(index),
    time: formatLocalLogTime(timestamp),
  };
}

export const logEntries: LogEntry[] = Array.from({ length: 420 }, (_, index) =>
  createLogEntry(index),
);
export const liveLogFallbackEntries = createLiveLogWindow(0, Date.now());
export const latestErrors = logEntries.filter((entry) => entry.severity === "error").length;
export const warningCount = logEntries.filter((entry) => entry.severity === "warning").length;
