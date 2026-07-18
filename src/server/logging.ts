import type { AppDependencies } from "./contracts";

export function createLogger(environment: string | undefined): AppDependencies["logger"] {
  return {
    write: (entry) => (environment === "test" ? undefined : console.info(JSON.stringify(entry))),
  };
}
