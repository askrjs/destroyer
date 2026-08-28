import { openDatabase } from "./database";
import type { AppDependencies } from "./contracts";
import { createLogger } from "./logging";
import { createRateLimits } from "./rate-limits";
import { createRepositories } from "./repositories";
import { createScenarioController } from "./scenario-controller";

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
  options: { path?: string; now?: () => number; createId?: () => string } = {},
): AppDependencies {
  const path = options.path ?? process.env.DESTROYER_DB_PATH ?? ".data/destroyer.sqlite";
  const now =
    options.now ??
    (process.env.NODE_ENV === "test" ? () => Date.parse("2026-01-15T12:00:00.000Z") : Date.now);
  let identifier = 0;
  const createId =
    options.createId ??
    (process.env.DESTROYER_DETERMINISTIC_IDS === "1"
      ? () => `00000000-0000-4000-8000-${String((identifier += 1)).padStart(12, "0")}`
      : () => crypto.randomUUID());
  const opened = openDatabase(path, now);
  const repositories = createRepositories(opened.database, now, createId);
  const scenarios = createScenarioController();
  let closed = false;

  const dependencies: AppDependencies = {
    ...repositories,
    scenarios,
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
