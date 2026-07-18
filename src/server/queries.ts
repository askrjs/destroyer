import { defineServerQueries, serveQuery } from "@askrjs/askr/data";
import { operatorActivityQuery, operatorSettingsQuery } from "../features/settings/settings-model";
import type { AppDependencies } from "./dependencies";
import { operationsMetricsQuery } from "../features/metrics/metrics-model";
import { liveLogQuery, toLogEntry } from "../features/logs/live-logs-resource";

export function createQueryRegistry(dependencies: AppDependencies) {
  return defineServerQueries(
    serveQuery(operatorSettingsQuery, async ({ input }) => {
      const settings = await dependencies.settings.get(input.principalId);
      if (!settings) throw new Error("Operator settings were not found.");
      return settings;
    }),
    serveQuery(operatorActivityQuery, ({ input }) =>
      dependencies.settings.activity(input.principalId),
    ),
    serveQuery(operationsMetricsQuery, () => dependencies.operations.metrics()),
    serveQuery(liveLogQuery, async () => {
      const page = await dependencies.operations.logs({ limit: 80 });
      return { ...page, entries: page.entries.map(toLogEntry) };
    }),
  );
}
