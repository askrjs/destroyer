import type { ValueChartDatum } from "@askrjs/charts/core";

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

export const responseHistogram: readonly ValueChartDatum[] = [
  { label: "0-50ms", value: 18, description: "Static and cached responses." },
  { label: "51-100ms", value: 34, description: "Most route transitions and local reads." },
  { label: "101-200ms", value: 29, description: "Primary app workflows." },
  { label: "201-400ms", value: 13, description: "Network-backed data refreshes." },
  { label: "400ms+", value: 6, description: "Slow calls that need follow-up." },
];

export const routeWorkload: readonly ValueChartDatum[] = [
  { label: "Logs", value: 46, description: "Virtual table and live stream activity." },
  { label: "Docs", value: 24, description: "Sidebar navigation and content scroll work." },
  { label: "Metrics", value: 17, description: "Chart rendering and tooltip interactions." },
  { label: "Settings", value: 13, description: "Form state and preference updates." },
];

export const channelMix: readonly ValueChartDatum[] = [
  { label: "Router", value: 38, description: "Route matching and link transitions." },
  { label: "Theme", value: 26, description: "Theme and density changes." },
  { label: "Data", value: 22, description: "Resource and query refresh activity." },
  { label: "Forms", value: 14, description: "Validation and submission events." },
];

export const issueShare: readonly ValueChartDatum[] = [
  { label: "Resolved", value: 54, description: "Closed without product follow-up." },
  { label: "Watched", value: 24, description: "Known behavior under active monitoring." },
  { label: "Queued", value: 16, description: "Scheduled for the next hardening pass." },
  { label: "Escalated", value: 6, description: "Needs upstream API or theme work." },
];

export const reliabilityTrend: readonly ValueChartDatum[] = [
  { label: "Mon", value: 99.72 },
  { label: "Tue", value: 99.78 },
  { label: "Wed", value: 99.83 },
  { label: "Thu", value: 99.81 },
  { label: "Fri", value: 99.9 },
  { label: "Sat", value: 99.88 },
  { label: "Sun", value: 99.92 },
];

export const requestTraceFlame = [
  {
    label: "HTTP request",
    value: 246,
    description: "Total time to serve a logs search request.",
    children: [
      {
        label: "API",
        value: 58,
        description: "Ingress latency, authentication, routing, and response shaping.",
        children: [
          { label: "Edge", value: 18, description: "TLS, edge routing, and network transit." },
          { label: "Auth", value: 14, description: "Session lookup and permission checks." },
          { label: "Validate", value: 8, description: "Normalize query params and filters." },
          { label: "Serialize", value: 18, description: "Shape response payload for the client." },
        ],
      },
      {
        label: "Service",
        value: 74,
        description: "Queue wait, search planning, and application enrichment.",
        children: [
          { label: "Queue", value: 8, description: "Wait for a service worker." },
          { label: "Plan", value: 18, description: "Build the search plan and paging window." },
          { label: "Cache", value: 12, description: "Read hot facets from memory." },
          { label: "Enrich", value: 36, description: "Join service metadata onto matching rows." },
        ],
      },
      {
        label: "Database",
        value: 114,
        description: "Connection wait, indexed query, row fetch, and aggregation work.",
        children: [
          { label: "Wait", value: 16, description: "Wait for a database connection." },
          { label: "Index", value: 24, description: "Scan the timestamp and severity indexes." },
          { label: "Fetch", value: 46, description: "Read matching log rows from storage." },
          { label: "Replica", value: 11, description: "Replica round-trip latency." },
          {
            label: "Aggregate",
            value: 17,
            description: "Compute level counts and latency buckets.",
          },
        ],
      },
    ],
  },
];

export function formatCount(value: number): string {
  return `${value}k`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

export function formatMs(value: number): string {
  return `${value}ms`;
}
