import type Database from "better-sqlite3";
import type {
  AppDependencies,
  OperatorSettings,
  SettingsUpdate,
  VersionedResult,
} from "./contracts";
import { ensureInvite, inviteHash } from "./repository-shared";

type SettingsRow = {
  version: number;
  profile_json: string;
  security_json: string;
  preferences_json: string;
  notifications_json: string;
  workspace_json: string;
};

function parseObject(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function settingsFromRow(
  database: Database.Database,
  principalId: string,
  row: SettingsRow,
  now: () => number,
): OperatorSettings {
  const profile = parseObject(row.profile_json);
  const security = parseObject(row.security_json);
  const preferences = parseObject(row.preferences_json);
  const notifications = parseObject(row.notifications_json);
  const workspace = parseObject(row.workspace_json);
  return {
    displayName: typeof profile.displayName === "string" ? profile.displayName : "Operator",
    profileVisibility: profile.visibility === "private" ? "private" : "workspace",
    sessionTimeoutMinutes:
      typeof security.sessionTimeout === "number" ? security.sessionTimeout : 30,
    density: preferences.density === "compact" ? "compact" : "comfortable",
    region:
      preferences.region === "us-west" || preferences.region === "eu-west"
        ? preferences.region
        : "us-east",
    theme:
      preferences.theme === "light" || preferences.theme === "dark" ? preferences.theme : "system",
    inAppNotifications: notifications.inApp !== false,
    defaultRole: workspace.defaultRole === "member" ? "member" : "viewer",
    approvalPolicy: workspace.approvalPolicy === "automatic" ? "automatic" : "manual",
    inviteLink: `/invite/${ensureInvite(database, principalId, now)}`,
    version: row.version,
  };
}

export function createSettingsRepository(
  database: Database.Database,
  now: () => number,
): AppDependencies["settings"] {
  const settings: AppDependencies["settings"] = {
    async get(principalId) {
      const row = database
        .prepare("SELECT * FROM operator_settings WHERE principal_id=?")
        .get(principalId) as SettingsRow | undefined;
      return row ? settingsFromRow(database, principalId, row, now) : null;
    },
    async update(
      principalId: string,
      input: SettingsUpdate,
      expectedVersion: number,
    ): Promise<VersionedResult<OperatorSettings>> {
      const row = database
        .prepare("SELECT * FROM operator_settings WHERE principal_id=?")
        .get(principalId) as SettingsRow | undefined;
      if (!row || row.version !== expectedVersion) return { kind: "conflict" };
      const current = settingsFromRow(database, principalId, row, now);
      const next = { ...current, ...input, version: expectedVersion + 1 };
      const occurredAt = new Date(now()).toISOString();
      const committed = database.transaction(() => {
        const result = database
          .prepare(
            "UPDATE operator_settings SET version=version+1,profile_json=?,security_json=?,preferences_json=?,notifications_json=?,workspace_json=? WHERE principal_id=? AND version=?",
          )
          .run(
            JSON.stringify({ displayName: next.displayName, visibility: next.profileVisibility }),
            JSON.stringify({ sessionTimeout: next.sessionTimeoutMinutes }),
            JSON.stringify({ density: next.density, region: next.region, theme: next.theme }),
            JSON.stringify({ inApp: next.inAppNotifications }),
            JSON.stringify({
              defaultRole: next.defaultRole,
              approvalPolicy: next.approvalPolicy,
            }),
            principalId,
            expectedVersion,
          );
        if (result.changes !== 1) return false;
        database
          .prepare("UPDATE principals SET name=? WHERE id=?")
          .run(next.displayName, principalId);
        database
          .prepare("INSERT INTO audit_events VALUES (?, ?, ?, 'operator_settings', ?, ?, ?)")
          .run(
            crypto.randomUUID(),
            principalId,
            "settings.update",
            principalId,
            JSON.stringify({ fields: Object.keys(input), previousVersion: expectedVersion }),
            occurredAt,
          );
        return true;
      })();
      return committed ? { kind: "updated", value: next } : { kind: "conflict" };
    },
    async resetInvite(principalId, expectedVersion) {
      const occurredAt = new Date(now()).toISOString();
      const token = crypto.randomUUID();
      const committed = database.transaction(() => {
        const result = database
          .prepare(
            "UPDATE operator_settings SET version=version+1 WHERE principal_id=? AND version=?",
          )
          .run(principalId, expectedVersion);
        if (result.changes !== 1) return false;
        database
          .prepare(
            "UPDATE invite_tokens SET revoked_at=? WHERE principal_id=? AND revoked_at IS NULL",
          )
          .run(occurredAt, principalId);
        database
          .prepare("INSERT INTO invite_tokens VALUES (?, ?, ?, ?, NULL)")
          .run(token, principalId, inviteHash(token), occurredAt);
        database
          .prepare(
            "INSERT INTO audit_events VALUES (?, ?, 'invite.reset', 'invite_token', ?, ?, ?)",
          )
          .run(
            crypto.randomUUID(),
            principalId,
            token,
            JSON.stringify({ previousVersion: expectedVersion }),
            occurredAt,
          );
        return true;
      })();
      const value = committed ? await settings.get(principalId) : null;
      return value ? { kind: "updated", value } : { kind: "conflict" };
    },
    async activity(principalId, limit = 50) {
      const rows = database
        .prepare(
          "SELECT id,action,target_type,target_id,detail_json,occurred_at FROM audit_events WHERE principal_id=? ORDER BY occurred_at DESC,id DESC LIMIT ?",
        )
        .all(principalId, limit) as Array<{
        id: string;
        action: string;
        target_type: string;
        target_id: string | null;
        detail_json: string;
        occurred_at: string;
      }>;
      return rows.map((row) => ({
        id: row.id,
        action: row.action,
        target: row.target_id ? `${row.target_type}:${row.target_id}` : row.target_type,
        detail: row.detail_json,
        occurredAt: row.occurred_at,
      }));
    },
  };
  return settings;
}
