import { handleAction } from "@askrjs/server/askr";
import { updateProfileAction } from "../features/settings/profile-model";
import type { AppDependencies } from "./dependencies";

export const profileActionHandlers = [
  handleAction<AppDependencies, { displayName: string; version: string }>(
    updateProfileAction,
    async (context, input, dependencies) => {
      if (!context.auth.principal) return { redirect: "/login" };
      const result = await dependencies.profiles.update(
        context.auth.principal.id,
        input.displayName.trim(),
        Number(input.version),
      );
      if (result.kind === "conflict")
        throw new Error("Profile settings changed; reload and retry.");
      return { redirect: "/settings", result: result.profile };
    },
  ),
] as const;
