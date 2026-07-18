import type Database from "better-sqlite3";
import type { AppDependencies, OperationsLogPage, OperationsMetrics } from "./contracts";
import { RepositoryConflictError } from "./contracts";

function encodeCursor(timestamp: string, id: string): string {
  return Buffer.from(JSON.stringify([timestamp, id]), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): readonly [string, string] {
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (
      Array.isArray(value) &&
      value.length === 2 &&
      value.every((part) => typeof part === "string")
    ) {
      return value as unknown as readonly [string, string];
    }
  } catch {
    // Normalized below as one typed repository validation error.
  }
  throw new RepositoryConflictError("The operations log cursor is invalid.");
}

function percentile95(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)] ?? 0;
}

export function createOperationsRepository(
  database: Database.Database,
): AppDependencies["operations"] {
  return {
    async summary() {
      const statuses = database
        .prepare("SELECT status, COUNT(*) count FROM services GROUP BY status")
        .all() as Array<{ status: string; count: number }>;
      const count = (status: string) => statuses.find((row) => row.status === status)?.count ?? 0;
      const openIncidents = (
        database
          .prepare("SELECT COUNT(*) count FROM incidents WHERE status != 'resolved'")
          .get() as {
          count: number;
        }
      ).count;
      const activeOperators = (
        database.prepare("SELECT COUNT(*) count FROM principals").get() as { count: number }
      ).count;
      return {
        healthyServices: count("healthy"),
        degradedServices: count("degraded"),
        openIncidents,
        activeOperators,
      };
    },
    async logs(input): Promise<OperationsLogPage> {
      const limit = Math.min(100, Math.max(1, input.limit));
      const cursor = input.cursor ? decodeCursor(input.cursor) : null;
      const clauses: string[] = [];
      const parameters: unknown[] = [];
      if (cursor) {
        clauses.push("(l.occurred_at < ? OR (l.occurred_at = ? AND l.id < ?))");
        parameters.push(cursor[0], cursor[0], cursor[1]);
      }
      if (input.route) {
        clauses.push("l.route = ?");
        parameters.push(input.route);
      }
      const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
      const rows = database
        .prepare(
          `SELECT l.id,l.occurred_at timestamp,s.name service,l.route,l.level severity,l.latency_ms latency,l.request_id requestId,l.message
           FROM log_events l JOIN services s ON s.id=l.service_id ${where}
           ORDER BY l.occurred_at DESC,l.id DESC LIMIT ?`,
        )
        .all(...parameters, limit + 1) as Array<{
        id: string;
        timestamp: string;
        service: string;
        route: string;
        severity: "info" | "warning" | "error";
        latency: number;
        requestId: string;
        message: string;
      }>;
      const entries = rows.slice(0, limit);
      const last = entries.at(-1);
      return {
        entries,
        nextCursor: rows.length > limit && last ? encodeCursor(last.timestamp, last.id) : null,
        sequence: Number(entries[0]?.id.replace(/\D/gu, "") ?? 0),
      };
    },
    async metrics(): Promise<OperationsMetrics> {
      const logs = database
        .prepare("SELECT route,level,latency_ms FROM log_events")
        .all() as Array<{ route: string; level: string; latency_ms: number }>;
      const requests = logs.length;
      const errors = logs.filter((row) => row.level === "error").length;
      const bands = [
        ["0-50", "0–50ms", 0, 50],
        ["51-100", "51–100ms", 51, 100],
        ["101-200", "101–200ms", 101, 200],
        ["201-400", "201–400ms", 201, 400],
        ["400-plus", "400ms+", 401, Number.POSITIVE_INFINITY],
      ] as const;
      const routeCounts = new Map<string, number>();
      logs.forEach((row) => routeCounts.set(row.route, (routeCounts.get(row.route) ?? 0) + 1));
      const serviceRows = database
        .prepare(
          "SELECT s.name service,COUNT(*) count FROM log_events l JOIN services s ON s.id=l.service_id GROUP BY s.id ORDER BY count DESC LIMIT 6",
        )
        .all() as Array<{ service: string; count: number }>;
      const reliabilityRows = database
        .prepare(
          "SELECT substr(occurred_at,1,10) day,COUNT(*) total,SUM(CASE WHEN level='error' THEN 1 ELSE 0 END) errors FROM log_events GROUP BY day ORDER BY day",
        )
        .all() as Array<{ day: string; total: number; errors: number }>;
      return {
        requests,
        p95LatencyMs: percentile95(logs.map((row) => row.latency_ms)),
        errorRate: requests === 0 ? 0 : (errors / requests) * 100,
        latencyBands: bands.map(([id, label, minimum, maximum]) => ({
          id,
          label,
          requests: logs.filter((row) => row.latency_ms >= minimum && row.latency_ms <= maximum)
            .length,
        })),
        routeWorkload: [...routeCounts].map(([route, count]) => ({
          id: route,
          route,
          requests: count,
        })),
        serviceMix: serviceRows.map((row) => ({
          id: row.service,
          service: row.service,
          share: requests === 0 ? 0 : (row.count / requests) * 100,
        })),
        reliability: reliabilityRows.map((row) => ({
          id: row.day,
          observedAt: `${row.day}T12:00:00.000Z`,
          successRate: row.total === 0 ? 100 : ((row.total - row.errors) / row.total) * 100,
        })),
      };
    },
  };
}
