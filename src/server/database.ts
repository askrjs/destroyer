import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { seedMessages, seedRoutes, seedServices } from "./seed";

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
  `ALTER TABLE log_events ADD COLUMN route TEXT NOT NULL DEFAULT '/';
   ALTER TABLE log_events ADD COLUMN latency_ms INTEGER NOT NULL DEFAULT 0;
   ALTER TABLE log_events ADD COLUMN request_id TEXT NOT NULL DEFAULT '';
   ALTER TABLE log_events ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}';
   ALTER TABLE metric_samples ADD COLUMN dimensions_json TEXT NOT NULL DEFAULT '{}';
   CREATE INDEX log_events_cursor ON log_events(occurred_at DESC, id DESC);
   CREATE INDEX log_events_route ON log_events(route, occurred_at DESC);
   CREATE TABLE invite_tokens (id TEXT PRIMARY KEY, principal_id TEXT NOT NULL REFERENCES principals(id) ON DELETE CASCADE, token_hash TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL, revoked_at TEXT);`,
] as const;

export interface OpenDatabase {
  readonly database: Database.Database;
  readonly migrationCurrent: boolean;
}

function migrate(database: Database.Database, now: () => number): void {
  database.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  const applied = new Set(
    (
      database.prepare("SELECT version FROM schema_migrations").all() as Array<{ version: number }>
    ).map(({ version }) => version),
  );
  database.transaction(() => {
    migrations.forEach((sql, index) => {
      const version = index + 1;
      if (applied.has(version)) return;
      database.exec(sql);
      database
        .prepare("INSERT INTO schema_migrations(version, applied_at) VALUES (?, ?)")
        .run(version, new Date(now()).toISOString());
    });
  })();
}

function seed(database: Database.Database, now: () => number): void {
  const version = (
    database.prepare("SELECT value FROM app_metadata WHERE key='seed_version'").get() as
      | { value: string }
      | undefined
  )?.value;
  if (version === "2") return;
  const timestamp = now();
  database.transaction(() => {
    if (!version) {
      const insertService = database.prepare("INSERT INTO services VALUES (?, ?, ?)");
      seedServices.forEach((name, index) =>
        insertService.run(`service-${index + 1}`, name, index === 2 ? "degraded" : "healthy"),
      );
      const insertIncident = database.prepare(
        "INSERT INTO incidents VALUES (?, ?, ?, ?, ?, 1, ?, ?)",
      );
      for (const incident of [
        ["inc-104", "Webhook delivery delays", "investigating", "high", "service-3"],
        ["inc-103", "Elevated billing retries", "acknowledged", "medium", "service-2"],
        ["inc-102", "Search indexing lag", "resolved", "low", "service-7"],
      ]) {
        insertIncident.run(
          ...incident,
          new Date(timestamp).toISOString(),
          new Date(timestamp).toISOString(),
        );
      }
      database
        .prepare("INSERT INTO policies VALUES (?, ?, ?, 1, ?)")
        .run(
          "support-escalation",
          "support-escalation",
          JSON.stringify({ rules: [{ when: "severity == 'high'", notify: "on-call" }] }),
          new Date(timestamp).toISOString(),
        );
    }

    if (version !== "2") {
      database.prepare("DELETE FROM log_events").run();
      database.prepare("DELETE FROM metric_samples").run();
      const insertLog = database.prepare(
        "INSERT INTO log_events(id,service_id,level,message,occurred_at,route,latency_ms,request_id,metadata_json) VALUES (?,?,?,?,?,?,?,?,?)",
      );
      for (let index = 0; index < 420; index += 1) {
        const severity = index % 29 === 0 ? "error" : index % 11 === 0 ? "warning" : "info";
        insertLog.run(
          `evt-${10_000 - index}`,
          `service-${(index % seedServices.length) + 1}`,
          severity,
          seedMessages[index % seedMessages.length],
          new Date(timestamp - index * 45_000).toISOString(),
          seedRoutes[index % seedRoutes.length],
          38 + ((index * 17) % 420),
          `req_${(index * 7919).toString(16).padStart(8, "0")}`,
          JSON.stringify({ seeded: true }),
        );
      }
      const insertMetric = database.prepare(
        "INSERT INTO metric_samples(service_id,name,value,sampled_at,dimensions_json) VALUES (?,?,?,?,?)",
      );
      for (let index = 0; index < 7 * 24; index += 1) {
        const service = `service-${(index % seedServices.length) + 1}`;
        const sampledAt = new Date(timestamp - index * 60 * 60_000).toISOString();
        insertMetric.run(service, "latency_ms", 50 + ((index * 13) % 220), sampledAt, "{}");
        insertMetric.run(service, "request_count", 600 + ((index * 37) % 500), sampledAt, "{}");
        insertMetric.run(service, "error_count", index % 23 === 0 ? 3 : 0, sampledAt, "{}");
      }
      database
        .prepare(
          "INSERT INTO app_metadata(key,value) VALUES ('seed_version','2') ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        )
        .run();
    }
  })();
}

export function openDatabase(path: string, now: () => number): OpenDatabase {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const database = new Database(path);
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  if (path !== ":memory:") database.pragma("journal_mode = WAL");
  migrate(database, now);
  seed(database, now);
  const current = (
    database.prepare("SELECT MAX(version) version FROM schema_migrations").get() as {
      version: number;
    }
  ).version;
  return { database, migrationCurrent: current === migrations.length };
}
