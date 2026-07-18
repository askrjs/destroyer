import type { Principal } from "@askrjs/auth";

export type LogLevel = "debug" | "info" | "warning" | "error";

export interface OperationsLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly service: string;
  readonly route: string;
  readonly severity: LogLevel;
  readonly latency: number;
  readonly requestId: string;
  readonly message: string;
}

export interface OperationsLogPage {
  readonly entries: readonly OperationsLogEntry[];
  readonly nextCursor: string | null;
  readonly sequence: number;
}

export interface OperationsMetrics {
  readonly requests: number;
  readonly p95LatencyMs: number;
  readonly errorRate: number;
  readonly latencyBands: readonly { id: string; label: string; requests: number }[];
  readonly routeWorkload: readonly { id: string; route: string; requests: number }[];
  readonly serviceMix: readonly { id: string; service: string; share: number }[];
  readonly reliability: readonly { id: string; observedAt: string; successRate: number }[];
}

export interface ActivityEntry {
  readonly id: string;
  readonly action: string;
  readonly target: string;
  readonly detail: string;
  readonly occurredAt: string;
}

export interface OperatorSettings {
  readonly displayName: string;
  readonly profileVisibility: "workspace" | "private";
  readonly sessionTimeoutMinutes: number;
  readonly density: "comfortable" | "compact";
  readonly region: "us-east" | "us-west" | "eu-west";
  readonly theme: "system" | "light" | "dark";
  readonly inAppNotifications: boolean;
  readonly defaultRole: "viewer" | "member";
  readonly approvalPolicy: "automatic" | "manual";
  readonly inviteLink: string;
  readonly version: number;
}

export interface OperationsSummary {
  readonly healthyServices: number;
  readonly degradedServices: number;
  readonly openIncidents: number;
  readonly activeOperators: number;
}

export interface SettingsUpdate {
  readonly displayName?: string;
  readonly profileVisibility?: OperatorSettings["profileVisibility"];
  readonly sessionTimeoutMinutes?: number;
  readonly density?: OperatorSettings["density"];
  readonly region?: OperatorSettings["region"];
  readonly theme?: OperatorSettings["theme"];
  readonly inAppNotifications?: boolean;
  readonly defaultRole?: OperatorSettings["defaultRole"];
  readonly approvalPolicy?: OperatorSettings["approvalPolicy"];
}

export type VersionedResult<T> =
  | { readonly kind: "updated"; readonly value: T }
  | { readonly kind: "conflict" };

export interface AppDependencies {
  readonly principals: { get(subject: string): Promise<Principal | null> };
  readonly accounts: {
    register(email: string, password: string): Promise<Principal>;
    authenticate(email: string, password: string): Promise<Principal | null>;
  };
  readonly settings: {
    get(principalId: string): Promise<OperatorSettings | null>;
    update(
      principalId: string,
      input: SettingsUpdate,
      expectedVersion: number,
    ): Promise<VersionedResult<OperatorSettings>>;
    resetInvite(
      principalId: string,
      expectedVersion: number,
    ): Promise<VersionedResult<OperatorSettings>>;
    activity(principalId: string, limit?: number): Promise<readonly ActivityEntry[]>;
  };
  readonly operations: {
    summary(): Promise<OperationsSummary>;
    logs(input: { cursor?: string; limit: number; route?: string }): Promise<OperationsLogPage>;
    metrics(): Promise<OperationsMetrics>;
  };
  readonly contacts: {
    create(input: {
      email: string;
      subject: string;
      message: string;
    }): Promise<{ id: string; receivedAt: string }>;
    count(): Promise<number>;
  };
  readonly invoices: { sampleCsv(principalId: string): Promise<string> };
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
  readonly health: {
    ready(): boolean;
    migrationsCurrent(): boolean;
    target(): Promise<boolean>;
  };
  readonly lifecycle: { close(): void };
}

export class RepositoryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryConflictError";
  }
}
