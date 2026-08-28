import { handleAction } from "@askrjs/server/askr";
import {
  resetInviteAction,
  updateNotificationsAction,
  updatePreferencesAction,
  updateProfileAction,
  updateSecurityAction,
  updateWorkspaceAction,
} from "../features/settings/settings-model";
import type { AppDependencies, SettingsUpdate } from "./contracts";

async function update(
  dependencies: AppDependencies,
  principalId: string,
  values: SettingsUpdate,
  version: string,
) {
  await dependencies.scenarios.before(principalId, "settings.update");
  const result = await dependencies.settings.update(principalId, values, Number(version));
  if (result.kind === "conflict") {
    throw new Error("Settings changed in another session; reload and retry.");
  }
  return result.value;
}

export const settingsActionHandlers = [
  handleAction<
    AppDependencies,
    { displayName: string; profileVisibility: "workspace" | "private"; version: string },
    | { kind: "updated"; value: Awaited<ReturnType<AppDependencies["settings"]["get"]>> }
    | { kind: "conflict" }
  >(updateProfileAction, async (context, input, dependencies) => {
    if (!context.auth.principal) return { redirect: "/login" };
    await dependencies.scenarios.before(context.auth.principal.id, "settings.update");
    const result = await dependencies.settings.update(
      context.auth.principal.id,
      { displayName: input.displayName.trim(), profileVisibility: input.profileVisibility },
      Number(input.version),
    );
    return { result };
  }),
  handleAction<AppDependencies, { sessionTimeoutMinutes: string; version: string }>(
    updateSecurityAction,
    async (context, input, dependencies) => {
      if (!context.auth.principal) return { redirect: "/login" };
      const value = await update(
        dependencies,
        context.auth.principal.id,
        { sessionTimeoutMinutes: Number(input.sessionTimeoutMinutes) },
        input.version,
      );
      return { result: value };
    },
  ),
  handleAction<
    AppDependencies,
    {
      density: "comfortable" | "compact";
      region: "us-east" | "us-west" | "eu-west";
      theme: "system" | "light" | "dark";
      timezone: "America/New_York" | "America/Los_Angeles" | "Europe/Dublin";
      version: string;
    }
  >(updatePreferencesAction, async (context, input, dependencies) => {
    if (!context.auth.principal) return { redirect: "/login" };
    const value = await update(
      dependencies,
      context.auth.principal.id,
      {
        density: input.density,
        region: input.region,
        theme: input.theme,
        timezone: input.timezone,
      },
      input.version,
    );
    return { result: value };
  }),
  handleAction<AppDependencies, { inAppNotifications: "enabled" | "disabled"; version: string }>(
    updateNotificationsAction,
    async (context, input, dependencies) => {
      if (!context.auth.principal) return { redirect: "/login" };
      const value = await update(
        dependencies,
        context.auth.principal.id,
        { inAppNotifications: input.inAppNotifications === "enabled" },
        input.version,
      );
      return { result: value };
    },
  ),
  handleAction<
    AppDependencies,
    {
      defaultRole: "viewer" | "member";
      approvalPolicy: "automatic" | "manual";
      approverGroup: string;
      version: string;
    },
    | { kind: "updated"; value: Awaited<ReturnType<AppDependencies["settings"]["get"]>> }
    | { kind: "conflict" }
  >(updateWorkspaceAction, async (context, input, dependencies) => {
    if (!context.auth.principal) return { redirect: "/login" };
    await dependencies.scenarios.before(context.auth.principal.id, "settings.update");
    const result = await dependencies.settings.update(
      context.auth.principal.id,
      {
        defaultRole: input.defaultRole,
        approvalPolicy: input.approvalPolicy,
        approverGroup: input.approverGroup.trim(),
      },
      Number(input.version),
    );
    return { result };
  }),
  handleAction<AppDependencies, { version: string }>(
    resetInviteAction,
    async (context, input, dependencies) => {
      if (!context.auth.principal) return { redirect: "/login" };
      await dependencies.scenarios.before(context.auth.principal.id, "settings.reset-invite");
      const result = await dependencies.settings.resetInvite(
        context.auth.principal.id,
        Number(input.version),
      );
      if (result.kind === "conflict") {
        throw new Error("Settings changed in another session; reload and retry.");
      }
      return { result: result.value };
    },
  ),
] as const;
