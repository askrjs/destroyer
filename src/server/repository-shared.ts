import type { Principal } from "@askrjs/auth";
import type Database from "better-sqlite3";
import { createHash } from "node:crypto";

export function principalFromDatabase(
  database: Database.Database,
  subject: string,
): Principal | null {
  const row = database.prepare("SELECT * FROM principals WHERE subject=?").get(subject) as
    | {
        id: string;
        subject: string;
        name: string;
        email: string;
        roles_json: string;
        permissions_json: string;
      }
    | undefined;
  return row
    ? {
        id: row.id,
        subject: row.subject,
        name: row.name,
        email: row.email,
        roles: JSON.parse(row.roles_json) as string[],
        permissions: JSON.parse(row.permissions_json) as string[],
      }
    : null;
}

export function inviteHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function ensureInvite(
  database: Database.Database,
  principalId: string,
  now: () => number,
): string {
  const active = database
    .prepare(
      "SELECT id FROM invite_tokens WHERE principal_id=? AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1",
    )
    .get(principalId) as { id: string } | undefined;
  if (active) return active.id;
  const token = crypto.randomUUID();
  database
    .prepare("INSERT INTO invite_tokens VALUES (?, ?, ?, ?, NULL)")
    .run(token, principalId, inviteHash(token), new Date(now()).toISOString());
  return token;
}
