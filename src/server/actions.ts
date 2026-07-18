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
  const result = await dependencies.settings.update(principalId, values, Number(version));
  if (result.kind === "conflict") {
    throw new Error("Settings changed in another session; reload and retry.");
  }
  return result.value;
}

export const settingsActionHandlers = [
  handleAction<
    AppDependencies,
    { displayName: string; profileVisibility: "workspace" | "private"; version: string }
  >(updateProfileAction, async (context, input, dependencies) => {
    if (!context.auth.principal) return { redirect: "/login" };
    const value = await update(
      dependencies,
      context.auth.principal.id,
      { displayName: input.displayName.trim(), profileVisibility: input.profileVisibility },
      input.version,
    );
    return { redirect: context.url.pathname, result: value };
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
      return { redirect: context.url.pathname, result: value };
    },
  ),
  handleAction<
    AppDependencies,
    {
      density: "comfortable" | "compact";
      region: "us-east" | "us-west" | "eu-west";
      theme: "system" | "light" | "dark";
      version: string;
    }
  >(updatePreferencesAction, async (context, input, dependencies) => {
    if (!context.auth.principal) return { redirect: "/login" };
    const value = await update(
      dependencies,
      context.auth.principal.id,
      { density: input.density, region: input.region, theme: input.theme },
      input.version,
    );
    return { redirect: context.url.pathname, result: value };
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
      return { redirect: context.url.pathname, result: value };
    },
  ),
  handleAction<
    AppDependencies,
    { defaultRole: "viewer" | "member"; approvalPolicy: "automatic" | "manual"; version: string }
  >(updateWorkspaceAction, async (context, input, dependencies) => {
    if (!context.auth.principal) return { redirect: "/login" };
    const value = await update(
      dependencies,
      context.auth.principal.id,
      { defaultRole: input.defaultRole, approvalPolicy: input.approvalPolicy },
      input.version,
    );
    return { redirect: context.url.pathname, result: value };
  }),
  handleAction<AppDependencies, { version: string }>(
    resetInviteAction,
    async (context, input, dependencies) => {
      if (!context.auth.principal) return { redirect: "/login" };
      const result = await dependencies.settings.resetInvite(
        context.auth.principal.id,
        Number(input.version),
      );
      if (result.kind === "conflict") {
        throw new Error("Settings changed in another session; reload and retry.");
      }
      return { redirect: context.url.pathname, result: result.value };
    },
  ),
] as const;
