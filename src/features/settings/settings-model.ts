import { defineAction } from "@askrjs/askr/actions";
import { createQuery, defineQuery, queryScope } from "@askrjs/askr/data";
import { schema } from "@askrjs/schema";
import type { ActivityEntry, OperatorSettings } from "../../server/contracts";

export const operatorSettingsScope = queryScope("destroyer.operator-settings");
export const operatorActivityScope = queryScope("destroyer.operator-activity");
const settingsInvalidations = [operatorSettingsScope.prefix(), operatorActivityScope.prefix()];

export const operatorSettingsQuery = defineQuery<{ principalId: string }, OperatorSettings>({
  key: ({ principalId }) => operatorSettingsScope.key(principalId),
  async fetch({ signal }) {
    const response = await fetch("/api/settings", { signal, credentials: "same-origin" });
    if (!response.ok) throw new Error(`Settings request failed (${response.status}).`);
    return response.json() as Promise<OperatorSettings>;
  },
});

export const operatorActivityQuery = defineQuery<{ principalId: string }, readonly ActivityEntry[]>(
  {
    key: ({ principalId }) => operatorActivityScope.key(principalId),
    async fetch({ signal }) {
      const response = await fetch("/api/activity", { signal, credentials: "same-origin" });
      if (!response.ok) throw new Error(`Activity request failed (${response.status}).`);
      return response.json() as Promise<readonly ActivityEntry[]>;
    },
  },
);

const version = schema.string({ pattern: "^[1-9][0-9]*$" });

export const updateProfileAction = defineAction({
  id: "update-profile",
  input: schema.object({
    displayName: schema.string({ minLength: 2, maxLength: 80 }),
    profileVisibility: schema.enum(["workspace", "private"]),
    version,
  }),
  invalidates: settingsInvalidations,
});

export const updateSecurityAction = defineAction({
  id: "update-security",
  input: schema.object({
    sessionTimeoutMinutes: schema.string({ pattern: "^(15|30|45|60|90|120)$" }),
    version,
  }),
  invalidates: settingsInvalidations,
});

export const updatePreferencesAction = defineAction({
  id: "update-preferences",
  input: schema.object({
    density: schema.enum(["comfortable", "compact"]),
    region: schema.enum(["us-east", "us-west", "eu-west"]),
    theme: schema.enum(["system", "light", "dark"]),
    version,
  }),
  invalidates: settingsInvalidations,
});

export const updateNotificationsAction = defineAction({
  id: "update-notifications",
  input: schema.object({ inAppNotifications: schema.enum(["enabled", "disabled"]), version }),
  invalidates: settingsInvalidations,
});

export const updateWorkspaceAction = defineAction({
  id: "update-workspace",
  input: schema.object({
    defaultRole: schema.enum(["viewer", "member"]),
    approvalPolicy: schema.enum(["automatic", "manual"]),
    version,
  }),
  invalidates: settingsInvalidations,
});

export const resetInviteAction = defineAction({
  id: "reset-invite",
  input: schema.object({ version }),
  invalidates: settingsInvalidations,
});

export const settingsActions = [
  updateProfileAction,
  updateSecurityAction,
  updatePreferencesAction,
  updateNotificationsAction,
  updateWorkspaceAction,
  resetInviteAction,
] as const;

export const operatorSettingsData = (principalId: string) =>
  createQuery(operatorSettingsQuery, { principalId });

export const operatorActivityData = (principalId: string) =>
  createQuery(operatorActivityQuery, { principalId });
