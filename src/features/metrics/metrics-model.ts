import { createQuery, defineQuery } from "@askrjs/askr/data";
import type { OperationsMetrics } from "../../server/contracts";

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
