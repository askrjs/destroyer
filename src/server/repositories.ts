import type Database from "better-sqlite3";
import { createAccountRepositories } from "./accounts-repository";
import type { AppDependencies } from "./contracts";
import { createOperationsRepository } from "./operations-repository";
import { createSettingsRepository } from "./settings-repository";
import { createSupportRepositories } from "./support-repository";

export function createRepositories(
  database: Database.Database,
  now: () => number,
): Pick<
  AppDependencies,
  "principals" | "accounts" | "settings" | "operations" | "contacts" | "invoices"
> {
  return {
    ...createAccountRepositories(database, now),
    settings: createSettingsRepository(database, now),
    operations: createOperationsRepository(database),
    ...createSupportRepositories(database, now),
  };
}
