import { createQuery, defineQuery } from "@askrjs/askr/data";
import type { OperationsMetrics, OperationsSummary } from "../../server/contracts";

export const operationsSummaryQuery = defineQuery<{ principalId: string }, OperationsSummary>({
  key: ({ principalId }) => `destroyer.operations-summary:${principalId}`,
  async fetch({ signal }) {
    const response = await fetch("/api/operations/summary", {
      signal,
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error(`Operations summary request failed (${response.status}).`);
    return response.json() as Promise<OperationsSummary>;
  },
});

export const operationsMetricsQuery = defineQuery<{ principalId: string }, OperationsMetrics>({
  key: ({ principalId }) => `destroyer.operations-metrics:${principalId}`,
  async fetch({ signal }) {
    const response = await fetch("/api/operations/metrics", {
      signal,
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error(`Operations metrics request failed (${response.status}).`);
    return response.json() as Promise<OperationsMetrics>;
  },
});

export const operationsMetricsData = (principalId: string) =>
  createQuery(operationsMetricsQuery, { principalId });

export const operationsSummaryData = (principalId: string) =>
  createQuery(operationsSummaryQuery, { principalId });
