export const seedServices = [
  "identity-api",
  "billing-worker",
  "webhook-gateway",
  "edge-router",
  "audit-stream",
  "notification-api",
  "search-indexer",
  "policy-engine",
  "session-store",
  "metrics-ingest",
  "reporting-api",
  "asset-proxy",
  "support-api",
  "scheduler",
  "email-worker",
  "fraud-detector",
  "catalog-api",
  "checkout-api",
  "operator-console",
] as const;

export const seedRoutes = [
  "/logs",
  "/metrics",
  "/settings",
  "/settings/security",
  "/profile/activity",
  "/contact",
] as const;

export const seedMessages = [
  "Request completed",
  "Route transition committed",
  "Latency exceeded the warning threshold",
  "Request exhausted its retry budget",
] as const;
