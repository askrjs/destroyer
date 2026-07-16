import type { Principal } from "@askrjs/auth";
import { hash, verify, argon2id } from "argon2";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const SESSION_COOKIE = "destroyer-session";
const PASSWORD_OPTIONS = {
  type: argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
} as const;

export interface AuditEntry {
  readonly id: string;
  readonly level: "info" | "warning" | "error";
  readonly service: string;
  readonly message: string;
  readonly timestamp: string;
}
export interface OperatorProfile {
  readonly displayName: string;
  readonly version: number;
}

export interface AppDependencies {
  readonly db: Database.Database;
  readonly principals: { get(subject: string): Promise<Principal | null> };
  readonly accounts: {
    register(email: string, password: string): Promise<Principal>;
    authenticate(email: string, password: string): Promise<Principal | null>;
  };
  readonly profiles: {
    get(principalId: string): Promise<OperatorProfile | null>;
    update(
      principalId: string,
      displayName: string,
      expectedVersion: number,
    ): Promise<{ kind: "updated"; profile: OperatorProfile } | { kind: "conflict" }>;
  };
  readonly operations: {
    summary(): Promise<{
      healthyServices: number;
      degradedServices: number;
      openIncidents: number;
      activeOperators: number;
    }>;
    logs(limit: number): Promise<readonly AuditEntry[]>;
  };
  readonly contacts: {
    create(input: {
      email: string;
      subject: string;
      message: string;
    }): Promise<{ id: string; receivedAt: string }>;
  };
  readonly rateLimits: {
    consume(
      key: string,
      limit: number,
      windowMs: number,
    ): Promise<{ allowed: boolean; remaining: number; reset: number }>;
  };
  readonly logger: {
    write(entry: { method: string; path: string; status: number; requestId?: string }): void;
  };
  readonly migrationCurrent: boolean;
  close(): void;
}

const migrations = [
  `CREATE TABLE app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
   CREATE TABLE principals (id TEXT PRIMARY KEY, subject TEXT UNIQUE NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, roles_json TEXT NOT NULL, permissions_json TEXT NOT NULL);
   CREATE TABLE sessions (id TEXT PRIMARY KEY, subject TEXT NOT NULL REFERENCES principals(subject) ON DELETE CASCADE, expires_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL, revoked_at INTEGER);
   CREATE TABLE operator_settings (principal_id TEXT PRIMARY KEY REFERENCES principals(id) ON DELETE CASCADE, version INTEGER NOT NULL DEFAULT 1, profile_json TEXT NOT NULL, security_json TEXT NOT NULL, preferences_json TEXT NOT NULL, notifications_json TEXT NOT NULL, workspace_json TEXT NOT NULL);
   CREATE TABLE services (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, status TEXT NOT NULL CHECK(status IN ('healthy','degraded','offline')));
   CREATE TABLE log_events (id TEXT PRIMARY KEY, service_id TEXT NOT NULL REFERENCES services(id), level TEXT NOT NULL CHECK(level IN ('info','warning','error')), message TEXT NOT NULL, occurred_at TEXT NOT NULL);
   CREATE TABLE metric_samples (id INTEGER PRIMARY KEY AUTOINCREMENT, service_id TEXT NOT NULL REFERENCES services(id), name TEXT NOT NULL, value REAL NOT NULL, sampled_at TEXT NOT NULL);
   CREATE TABLE incidents (id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL, severity TEXT NOT NULL, service_id TEXT REFERENCES services(id), version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
   CREATE TABLE policies (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, document_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);
   CREATE TABLE support_requests (id TEXT PRIMARY KEY, email TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL, received_at TEXT NOT NULL);
   CREATE TABLE audit_events (id TEXT PRIMARY KEY, principal_id TEXT REFERENCES principals(id), action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT, detail_json TEXT NOT NULL, occurred_at TEXT NOT NULL);`,
  `CREATE UNIQUE INDEX principals_email_unique ON principals(email COLLATE NOCASE);
   CREATE TABLE credentials (principal_id TEXT PRIMARY KEY REFERENCES principals(id) ON DELETE CASCADE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
   DROP TABLE sessions;
   DELETE FROM operator_settings WHERE principal_id='operator-1';
   DELETE FROM principals WHERE id='operator-1';`,
];

function migrate(db: Database.Database): void {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  const applied = new Set(
    (db.prepare("SELECT version FROM schema_migrations").all() as Array<{ version: number }>).map(
      ({ version }) => version,
    ),
  );
  const apply = db.transaction(() =>
    migrations.forEach((sql, index) => {
      const version = index + 1;
      if (applied.has(version)) return;
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations(version, applied_at) VALUES (?, ?)").run(
        version,
        new Date().toISOString(),
      );
    }),
  );
  apply();
}

function seed(db: Database.Database): void {
  if (
    (
      db.prepare("SELECT value FROM app_metadata WHERE key='seed_version'").get() as
        | { value: string }
        | undefined
    )?.value === "1"
  )
    return;
  const now = new Date();
  const serviceNames = [
    "identity-api",
    "billing-worker",
    "webhook-gateway",
    "edge-router",
    "audit-stream",
    "notification-api",
    "search-indexer",
    "policy-engine",
    "session-store",
    "metrics-ingest",
    "reporting-api",
    "asset-proxy",
    "support-api",
    "scheduler",
    "email-worker",
    "fraud-detector",
    "catalog-api",
    "checkout-api",
    "operator-console",
  ];
  const run = db.transaction(() => {
    const insertService = db.prepare("INSERT INTO services VALUES (?, ?, ?)");
    serviceNames.forEach((name, index) =>
      insertService.run(`service-${index + 1}`, name, index === 2 ? "degraded" : "healthy"),
    );
    const insertLog = db.prepare("INSERT INTO log_events VALUES (?, ?, ?, ?, ?)");
    for (let index = 0; index < 80; index += 1)
      insertLog.run(
        `evt-${1100 - index}`,
        `service-${(index % serviceNames.length) + 1}`,
        index % 17 === 0 ? "error" : index % 7 === 0 ? "warning" : "info",
        index % 17 === 0
          ? "Request exhausted its retry budget"
          : index % 7 === 0
            ? "Latency exceeded the warning threshold"
            : "Request completed",
        new Date(now.getTime() - index * 45_000).toISOString(),
      );
    const insertMetric = db.prepare(
      "INSERT INTO metric_samples(service_id,name,value,sampled_at) VALUES (?,?,?,?)",
    );
    for (let index = 0; index < 96; index += 1)
      insertMetric.run(
        `service-${(index % serviceNames.length) + 1}`,
        "latency_ms",
        40 + (index % 19) * 3,
        new Date(now.getTime() - index * 300_000).toISOString(),
      );
    const insertIncident = db.prepare("INSERT INTO incidents VALUES (?, ?, ?, ?, ?, 1, ?, ?)");
    insertIncident.run(
      "inc-104",
      "Webhook delivery delays",
      "investigating",
      "high",
      "service-3",
      now.toISOString(),
      now.toISOString(),
    );
    insertIncident.run(
      "inc-103",
      "Elevated billing retries",
      "acknowledged",
      "medium",
      "service-2",
      now.toISOString(),
      now.toISOString(),
    );
    insertIncident.run(
      "inc-102",
      "Search indexing lag",
      "resolved",
      "low",
      "service-7",
      now.toISOString(),
      now.toISOString(),
    );
    db.prepare("INSERT INTO policies VALUES (?, ?, ?, 1, ?)").run(
      "support-escalation",
      "support-escalation",
      JSON.stringify(
        { version: 1, rules: [{ when: "severity == 'high'", notify: "on-call" }] },
        null,
        2,
      ),
      now.toISOString(),
    );
    db.prepare("INSERT INTO app_metadata VALUES ('seed_version','1')").run();
  });
  run();
}

export function createDependencies(
  options: { path?: string; now?: () => number } = {},
): AppDependencies {
  const path = options.path ?? process.env.DESTROYER_DB_PATH ?? ".data/destroyer.sqlite";
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  if (path !== ":memory:") db.pragma("journal_mode = WAL");
  migrate(db);
  seed(db);
  const now = options.now ?? Date.now;
  const counters = new Map<string, { count: number; reset: number }>();
  const dummyHash = hash("destroyer-dummy-password", PASSWORD_OPTIONS);
  const principal = (subject: string): Principal | null => {
    const row = db.prepare("SELECT * FROM principals WHERE subject=?").get(subject) as
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
          roles: JSON.parse(row.roles_json),
          permissions: JSON.parse(row.permissions_json),
        }
      : null;
  };
  return {
    db,
    migrationCurrent:
      Number(
        (
          db.prepare("SELECT MAX(version) version FROM schema_migrations").get() as {
            version: number;
          }
        ).version,
      ) === migrations.length,
    principals: {
      async get(subject) {
        return principal(subject);
      },
    },
    accounts: {
      async register(email, password) {
        const normalized = email.trim().toLowerCase();
        const id = crypto.randomUUID();
        const label = normalized.slice(0, normalized.indexOf("@")) || "Operator";
        const passwordHash = await hash(password, PASSWORD_OPTIONS);
        const timestamp = new Date(now()).toISOString();
        const insert = db.transaction(() => {
          db.prepare("INSERT INTO principals VALUES (?, ?, ?, ?, ?, ?)").run(
            id,
            id,
            label,
            normalized,
            '["operator"]',
            '["operations:read","operations:write"]',
          );
          db.prepare("INSERT INTO credentials VALUES (?, ?, ?, ?)").run(
            id,
            passwordHash,
            timestamp,
            timestamp,
          );
          db.prepare("INSERT INTO operator_settings VALUES (?, 1, ?, ?, ?, ?, ?)").run(
            id,
            JSON.stringify({ displayName: label }),
            '{"sessionTimeout":30}',
            '{"theme":"system","density":"comfortable"}',
            '{"email":true,"inApp":true}',
            '{"defaultRole":"viewer"}',
          );
          db.prepare(
            "INSERT INTO audit_events VALUES (?, ?, 'account.signup', 'principal', ?, '{}', ?)",
          ).run(crypto.randomUUID(), id, id, timestamp);
        });
        insert();
        return principal(id)!;
      },
      async authenticate(email, password) {
        const normalized = email.trim().toLowerCase();
        const row = db
          .prepare(
            "SELECT p.subject,c.password_hash FROM principals p JOIN credentials c ON c.principal_id=p.id WHERE p.email=?",
          )
          .get(normalized) as { subject: string; password_hash: string } | undefined;
        const valid = await verify(row?.password_hash ?? (await dummyHash), password);
        return valid && row ? principal(row.subject) : null;
      },
    },
    profiles: {
      async get(principalId) {
        const row = db
          .prepare("SELECT version,profile_json FROM operator_settings WHERE principal_id=?")
          .get(principalId) as { version: number; profile_json: string } | undefined;
        if (!row) return null;
        const profile = JSON.parse(row.profile_json) as { displayName?: unknown };
        return {
          displayName: typeof profile.displayName === "string" ? profile.displayName : "Operator",
          version: row.version,
        };
      },
      async update(principalId, displayName, expectedVersion) {
        const timestamp = new Date(now()).toISOString();
        const update = db.transaction(() => {
          const result = db
            .prepare(
              "UPDATE operator_settings SET profile_json=?,version=version+1 WHERE principal_id=? AND version=?",
            )
            .run(JSON.stringify({ displayName }), principalId, expectedVersion);
          if (result.changes !== 1) return false;
          db.prepare(
            "INSERT INTO audit_events VALUES (?, ?, 'profile.update', 'operator_settings', ?, ?, ?)",
          ).run(
            crypto.randomUUID(),
            principalId,
            principalId,
            JSON.stringify({ displayName, previousVersion: expectedVersion }),
            timestamp,
          );
          db.prepare("UPDATE principals SET name=? WHERE id=?").run(displayName, principalId);
          return true;
        });
        if (!update()) return { kind: "conflict" as const };
        return {
          kind: "updated" as const,
          profile: { displayName, version: expectedVersion + 1 },
        };
      },
    },
    operations: {
      async summary() {
        const statuses = db
          .prepare("SELECT status, COUNT(*) count FROM services GROUP BY status")
          .all() as Array<{ status: string; count: number }>;
        const count = (status: string) => statuses.find((row) => row.status === status)?.count ?? 0;
        const openIncidents = (
          db.prepare("SELECT COUNT(*) count FROM incidents WHERE status != 'resolved'").get() as {
            count: number;
          }
        ).count;
        const activeOperators = (
          db.prepare("SELECT COUNT(*) count FROM principals").get() as { count: number }
        ).count;
        return {
          healthyServices: count("healthy"),
          degradedServices: count("degraded"),
          openIncidents,
          activeOperators,
        };
      },
      async logs(limit) {
        return db
          .prepare(
            "SELECT l.id,l.level,s.name service,l.message,l.occurred_at timestamp FROM log_events l JOIN services s ON s.id=l.service_id ORDER BY l.occurred_at DESC LIMIT ?",
          )
          .all(limit) as AuditEntry[];
      },
    },
    contacts: {
      async create(input) {
        const receipt = { id: crypto.randomUUID(), receivedAt: new Date(now()).toISOString() };
        db.prepare("INSERT INTO support_requests VALUES (?, ?, ?, ?, ?)").run(
          receipt.id,
          input.email,
          input.subject,
          input.message,
          receipt.receivedAt,
        );
        return receipt;
      },
    },
    rateLimits: {
      async consume(key, limit, windowMs) {
        const time = now();
        const current = counters.get(key);
        const state =
          !current || current.reset <= time ? { count: 0, reset: time + windowMs } : current;
        state.count += 1;
        counters.set(key, state);
        return {
          allowed: state.count <= limit,
          remaining: Math.max(0, limit - state.count),
          reset: state.reset,
        };
      },
    },
    logger: {
      write: (entry) =>
        process.env.NODE_ENV === "test" ? undefined : console.info(JSON.stringify(entry)),
    },
    close: () => db.close(),
  };
}
