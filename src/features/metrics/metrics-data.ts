export interface ResponseDistributionRow {
  readonly id: string;
  readonly latencyBand: string;
  readonly requests: number;
  readonly description: string;
}

export interface RouteWorkloadRow {
  readonly id: string;
  readonly route: string;
  readonly requests: number;
  readonly description: string;
}

export interface SubsystemMixRow {
  readonly id: string;
  readonly subsystem: string;
  readonly share: number;
  readonly description: string;
}

export interface ReliabilityRow {
  readonly id: string;
  readonly observedAt: Date;
  readonly successRate: number;
  readonly description: string;
}

export function formatDay(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(date);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}
