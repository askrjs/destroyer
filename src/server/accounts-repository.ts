import { argon2id, hash, verify } from "argon2";
import Database from "better-sqlite3";
import type { AppDependencies } from "./contracts";
import { RepositoryConflictError } from "./contracts";
import { ensureInvite, principalFromDatabase } from "./repository-shared";

const PASSWORD_OPTIONS = {
  type: argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
} as const;

export function createAccountRepositories(
  database: Database.Database,
  now: () => number,
): Pick<AppDependencies, "principals" | "accounts"> {
  const dummyHash = hash("destroyer-dummy-password", PASSWORD_OPTIONS);
  return {
    principals: {
      async get(subject) {
        return principalFromDatabase(database, subject);
      },
    },
    accounts: {
      async register(email, password) {
        const normalized = email.trim().toLowerCase();
        const id = crypto.randomUUID();
        const label = normalized.slice(0, normalized.indexOf("@")) || "Operator";
        const passwordHash = await hash(password, PASSWORD_OPTIONS);
        const occurredAt = new Date(now()).toISOString();
        try {
          database.transaction(() => {
            database
              .prepare("INSERT INTO principals VALUES (?, ?, ?, ?, ?, ?)")
              .run(
                id,
                id,
                label,
                normalized,
                '["operator"]',
                '["operations:read","operations:write"]',
              );
            database
              .prepare("INSERT INTO credentials VALUES (?, ?, ?, ?)")
              .run(id, passwordHash, occurredAt, occurredAt);
            database
              .prepare("INSERT INTO operator_settings VALUES (?, 1, ?, ?, ?, ?, ?)")
              .run(
                id,
                JSON.stringify({ displayName: label, visibility: "workspace" }),
                '{"sessionTimeout":30}',
                '{"theme":"system","density":"comfortable","region":"us-east"}',
                '{"inApp":true}',
                '{"defaultRole":"viewer","approvalPolicy":"manual"}',
              );
            ensureInvite(database, id, now);
            database
              .prepare(
                "INSERT INTO audit_events VALUES (?, ?, 'account.signup', 'principal', ?, '{}', ?)",
              )
              .run(crypto.randomUUID(), id, id, occurredAt);
          })();
        } catch (error) {
          if (error instanceof Database.SqliteError && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            throw new RepositoryConflictError("An account with this email already exists.");
          }
          throw error;
        }
        return principalFromDatabase(database, id)!;
      },
      async authenticate(email, password) {
        const normalized = email.trim().toLowerCase();
        const row = database
          .prepare(
            "SELECT p.subject,c.password_hash FROM principals p JOIN credentials c ON c.principal_id=p.id WHERE p.email=?",
          )
          .get(normalized) as { subject: string; password_hash: string } | undefined;
        const valid = await verify(row?.password_hash ?? (await dummyHash), password);
        return valid && row ? principalFromDatabase(database, row.subject) : null;
      },
    },
  };
}
