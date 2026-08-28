import type Database from "better-sqlite3";
import { createAccountRepositories } from "./accounts-repository";
import type { AppDependencies } from "./contracts";
import { createOperationsRepository } from "./operations-repository";
import { createSettingsRepository } from "./settings-repository";
import { createSupportRepositories } from "./support-repository";

export function createRepositories(
  database: Database.Database,
  now: () => number,
  createId: () => string,
): Pick<
  AppDependencies,
  "principals" | "accounts" | "settings" | "operations" | "contacts" | "invoices"
> {
  return {
    ...createAccountRepositories(database, now, createId),
    settings: createSettingsRepository(database, now, createId),
    operations: createOperationsRepository(database, now),
    ...createSupportRepositories(database, now, createId),
  };
}
