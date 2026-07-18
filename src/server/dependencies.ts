import { openDatabase } from "./database";
import type { AppDependencies } from "./contracts";
import { createLogger } from "./logging";
import { createRateLimits } from "./rate-limits";
import { createRepositories } from "./repositories";

export const SESSION_COOKIE = "destroyer-session";
export type {
  ActivityEntry,
  AppDependencies,
  OperationsLogEntry,
  OperationsLogPage,
  OperationsMetrics,
  OperationsSummary,
  OperatorSettings,
} from "./contracts";

export function createDependencies(
  options: { path?: string; now?: () => number } = {},
): AppDependencies {
  const path = options.path ?? process.env.DESTROYER_DB_PATH ?? ".data/destroyer.sqlite";
  const now = options.now ?? Date.now;
  const opened = openDatabase(path, now);
  const repositories = createRepositories(opened.database, now);
  let closed = false;

  const dependencies: AppDependencies = {
    ...repositories,
    rateLimits: createRateLimits(now),
    logger: createLogger(process.env.NODE_ENV),
    health: {
      ready: () => !closed && opened.database.open,
      migrationsCurrent: () => opened.migrationCurrent,
      target: async () => {
        const summary = await repositories.operations.summary();
        return (
          summary.healthyServices === 18 &&
          summary.degradedServices === 1 &&
          summary.openIncidents >= 2
        );
      },
    },
    lifecycle: {
      close: () => {
        if (closed) return;
        closed = true;
        opened.database.close();
      },
    },
  };
  return dependencies;
}
