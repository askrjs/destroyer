export interface ResponseDistributionRow {
  readonly id: string;
  readonly latencyBand: string;
  readonly requests: number;
  readonly description: string;
}

export interface RouteWorkloadRow {
  readonly id: string;
  readonly route: string;
  readonly requests: number;
  readonly description: string;
}

export interface SubsystemMixRow {
  readonly id: string;
  readonly subsystem: string;
  readonly share: number;
  readonly description: string;
}

export interface ReliabilityRow {
  readonly id: string;
  readonly observedAt: Date;
  readonly successRate: number;
  readonly description: string;
}

export interface RequestTraceRow {
  readonly id: string;
  readonly label: string;
  readonly lane: "Request" | "Subsystem" | "Operation";
  readonly startMs: number;
  readonly endMs: number;
  readonly subsystem: "Request" | "API" | "Service" | "Database";
  readonly description: string;
}

export const metricHighlights = [
  {
    label: "Requests",
    value: "1.84M",
    detail: "Last 24 hours across app routes.",
    badge: "Up 8%",
    variant: "success",
  },
  {
    label: "P95 latency",
    value: "184ms",
    detail: "Weighted across shell, docs, logs, and settings.",
    badge: "Stable",
    variant: "info",
  },
  {
    label: "Error rate",
    value: "0.08%",
    detail: "Includes retryable API and route hydration failures.",
    badge: "Low",
    variant: "success",
  },
] as const;

export const responseDistribution: readonly ResponseDistributionRow[] = [
  {
    id: "latency-0-50",
    latencyBand: "0–50ms",
    requests: 18,
    description: "Static and cached responses.",
  },
  {
    id: "latency-51-100",
    latencyBand: "51–100ms",
    requests: 34,
    description: "Most route transitions and local reads.",
  },
  {
    id: "latency-101-200",
    latencyBand: "101–200ms",
    requests: 29,
    description: "Primary app workflows.",
  },
  {
    id: "latency-201-400",
    latencyBand: "201–400ms",
    requests: 13,
    description: "Network-backed data refreshes.",
  },
  {
    id: "latency-400-plus",
    latencyBand: "400ms+",
    requests: 6,
    description: "Slow calls that need follow-up.",
  },
];

export const routeWorkload: readonly RouteWorkloadRow[] = [
  {
    id: "route-logs",
    route: "Logs",
    requests: 46,
    description: "Virtual table and live stream activity.",
  },
  {
    id: "route-docs",
    route: "Docs",
    requests: 24,
    description: "Sidebar navigation and content scroll work.",
  },
  {
    id: "route-metrics",
    route: "Metrics",
    requests: 17,
    description: "Plot rendering and inspection interactions.",
  },
  {
    id: "route-settings",
    route: "Settings",
    requests: 13,
    description: "Form state and preference updates.",
  },
];

export const subsystemMix: readonly SubsystemMixRow[] = [
  {
    id: "subsystem-router",
    subsystem: "Router",
    share: 38,
    description: "Route matching and link transitions.",
  },
  {
    id: "subsystem-theme",
    subsystem: "Theme",
    share: 26,
    description: "Theme and density changes.",
  },
  {
    id: "subsystem-data",
    subsystem: "Data",
    share: 22,
    description: "Resource and query refresh activity.",
  },
  {
    id: "subsystem-forms",
    subsystem: "Forms",
    share: 14,
    description: "Validation and submission events.",
  },
];

export const reliabilityTrend: readonly ReliabilityRow[] = [
  {
    id: "reliability-mon",
    observedAt: new Date("2026-07-13T12:00:00.000Z"),
    successRate: 99.72,
    description: "Monday success rate: 99.72%.",
  },
  {
    id: "reliability-tue",
    observedAt: new Date("2026-07-14T12:00:00.000Z"),
    successRate: 99.78,
    description: "Tuesday success rate: 99.78%.",
  },
  {
    id: "reliability-wed",
    observedAt: new Date("2026-07-15T12:00:00.000Z"),
    successRate: 99.83,
    description: "Wednesday success rate: 99.83%.",
  },
  {
    id: "reliability-thu",
    observedAt: new Date("2026-07-16T12:00:00.000Z"),
    successRate: 99.81,
    description: "Thursday success rate: 99.81%.",
  },
  {
    id: "reliability-fri",
    observedAt: new Date("2026-07-17T12:00:00.000Z"),
    successRate: 99.9,
    description: "Friday success rate: 99.90%.",
  },
  {
    id: "reliability-sat",
    observedAt: new Date("2026-07-18T12:00:00.000Z"),
    successRate: 99.88,
    description: "Saturday success rate: 99.88%.",
  },
  {
    id: "reliability-sun",
    observedAt: new Date("2026-07-19T12:00:00.000Z"),
    successRate: 99.92,
    description: "Sunday success rate: 99.92%.",
  },
];

export const requestTrace: readonly RequestTraceRow[] = [
  {
    id: "request",
    label: "HTTP request",
    lane: "Request",
    startMs: 0,
    endMs: 246,
    subsystem: "Request",
    description: "Total time to serve a logs search request: 246ms.",
  },
  {
    id: "api",
    label: "API",
    lane: "Subsystem",
    startMs: 0,
    endMs: 58,
    subsystem: "API",
    description: "Ingress, authentication, routing, and response shaping: 58ms.",
  },
  {
    id: "service",
    label: "Service",
    lane: "Subsystem",
    startMs: 58,
    endMs: 132,
    subsystem: "Service",
    description: "Queue wait, search planning, and enrichment: 74ms.",
  },
  {
    id: "database",
    label: "Database",
    lane: "Subsystem",
    startMs: 132,
    endMs: 246,
    subsystem: "Database",
    description: "Connection wait, indexed query, row fetch, and aggregation: 114ms.",
  },
  {
    id: "edge",
    label: "Edge",
    lane: "Operation",
    startMs: 0,
    endMs: 18,
    subsystem: "API",
    description: "TLS, edge routing, and network transit: 18ms.",
  },
  {
    id: "auth",
    label: "Auth",
    lane: "Operation",
    startMs: 18,
    endMs: 32,
    subsystem: "API",
    description: "Session lookup and permission checks: 14ms.",
  },
  {
    id: "validate",
    label: "Validate",
    lane: "Operation",
    startMs: 32,
    endMs: 40,
    subsystem: "API",
    description: "Normalize query parameters and filters: 8ms.",
  },
  {
    id: "serialize",
    label: "Serialize",
    lane: "Operation",
    startMs: 40,
    endMs: 58,
    subsystem: "API",
    description: "Shape the response payload: 18ms.",
  },
  {
    id: "queue",
    label: "Queue",
    lane: "Operation",
    startMs: 58,
    endMs: 66,
    subsystem: "Service",
    description: "Wait for a service worker: 8ms.",
  },
  {
    id: "plan",
    label: "Plan",
    lane: "Operation",
    startMs: 66,
    endMs: 84,
    subsystem: "Service",
    description: "Build the search plan and paging window: 18ms.",
  },
  {
    id: "cache",
    label: "Cache",
    lane: "Operation",
    startMs: 84,
    endMs: 96,
    subsystem: "Service",
    description: "Read hot facets from memory: 12ms.",
  },
  {
    id: "enrich",
    label: "Enrich",
    lane: "Operation",
    startMs: 96,
    endMs: 132,
    subsystem: "Service",
    description: "Join service metadata onto matching rows: 36ms.",
  },
  {
    id: "connection-wait",
    label: "Wait",
    lane: "Operation",
    startMs: 132,
    endMs: 148,
    subsystem: "Database",
    description: "Wait for a database connection: 16ms.",
  },
  {
    id: "index",
    label: "Index",
    lane: "Operation",
    startMs: 148,
    endMs: 172,
    subsystem: "Database",
    description: "Scan timestamp and severity indexes: 24ms.",
  },
  {
    id: "fetch",
    label: "Fetch",
    lane: "Operation",
    startMs: 172,
    endMs: 218,
    subsystem: "Database",
    description: "Read matching log rows from storage: 46ms.",
  },
  {
    id: "replica",
    label: "Replica",
    lane: "Operation",
    startMs: 218,
    endMs: 229,
    subsystem: "Database",
    description: "Replica round-trip latency: 11ms.",
  },
  {
    id: "aggregate",
    label: "Aggregate",
    lane: "Operation",
    startMs: 229,
    endMs: 246,
    subsystem: "Database",
    description: "Compute level counts and latency buckets: 17ms.",
  },
];

export function formatDay(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
  }).format(date);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}
