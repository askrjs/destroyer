import { defineServerQueries, serveQuery } from "@askrjs/askr/data";
import { operatorProfileQuery } from "../features/settings/profile-model";
import type { AppDependencies } from "./dependencies";

export function createQueryRegistry(dependencies: AppDependencies) {
  return defineServerQueries(
    serveQuery(operatorProfileQuery, async ({ input }) => {
      const profile = await dependencies.profiles.get(input.principalId);
      if (!profile) throw new Error("Profile settings were not found.");
      return profile;
    }),
  );
}
