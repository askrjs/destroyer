import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLiveLogs, toLogEntry } from "../src/features/logs/live-logs-resource";
import type { OperationsLogPage } from "../src/server/contracts";

type Entry = OperationsLogPage["entries"][number];
const entry = (timestamp: string, index = 0): Entry => ({
  id: `log-${index}`,
  timestamp,
  service: "gateway",
  route: `/requests/${index}`,
  severity: "info",
  latency: index,
  requestId: `request-${index}`,
  message: `message-${index}`,
});
const signal = () => new AbortController().signal;
const observeFormatterConstruction = () => {
  const NativeDateTimeFormat = Intl.DateTimeFormat;
  return vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (locales, options) {
    return new NativeDateTimeFormat(locales, options);
  });
};
const respond = (entries: readonly Entry[]) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ entries, nextCursor: "older", sequence: 80 }),
    }),
  );
};
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("live log page time formatting", () => {
  it("formats 80 valid rows without constructing locale machinery per row", async () => {
    const entries = Array.from({ length: 80 }, (_, index) =>
      entry(`2026-10-02T12:34:${String(index % 60).padStart(2, "0")}Z`, index),
    );
    const expected = entries.map(toLogEntry);
    respond(entries);
    const legacyCalls = vi.spyOn(Date.prototype, "toLocaleTimeString");
    const constructorCalls = observeFormatterConstruction();
    const result = await fetchLiveLogs({ principalId: "principal" }, { signal: signal() });
    expect(result).toEqual({ entries: expected, nextCursor: "older", sequence: 80 });
    expect(legacyCalls).toHaveBeenCalledTimes(0);
    expect(constructorCalls).toHaveBeenCalledTimes(1);
  });

  it("uses a fresh formatter for each page and none for an empty page", async () => {
    const entries = [entry("2026-10-02T00:00:00Z")];
    const expected = entries.map(toLogEntry);
    const constructorCalls = observeFormatterConstruction();
    respond(entries);
    const first = await fetchLiveLogs({ principalId: "a" }, { signal: signal() });
    const second = await fetchLiveLogs({ principalId: "b" }, { signal: signal() });
    expect(first.entries).toEqual(expected);
    expect(second.entries).toEqual(expected);
    expect(constructorCalls).toHaveBeenCalledTimes(2);
    respond([]);
    expect((await fetchLiveLogs({ principalId: "c" }, { signal: signal() })).entries).toEqual([]);
    expect(constructorCalls).toHaveBeenCalledTimes(2);
  });

  it("preserves native default locale/timezone, midnight, both DST transitions and row order", async () => {
    const entries = [
      "2026-01-01T00:00:00Z",
      "2026-03-08T06:59:59Z",
      "2026-03-08T07:00:00Z",
      "2026-11-01T05:59:59Z",
      "2026-11-01T06:00:00Z",
      "2026-06-01T23:59:59.999Z",
    ].map(entry);
    const expected = entries.map(toLogEntry);
    respond(entries);
    const result = await fetchLiveLogs({ principalId: "principal" }, { signal: signal() });
    expect(result.entries).toEqual(expected);
    expect(result.entries.map((row) => row.id)).toEqual(entries.map((row) => row.id));
  });

  it("resolves the current default timezone independently for consecutive pages", async () => {
    const entries = [entry("2026-10-02T12:00:00Z")];
    respond(entries);
    vi.stubEnv("TZ", "America/New_York");
    const firstExpected = entries.map(toLogEntry);
    const first = await fetchLiveLogs({ principalId: "a" }, { signal: signal() });
    vi.stubEnv("TZ", "UTC");
    const secondExpected = entries.map(toLogEntry);
    const second = await fetchLiveLogs({ principalId: "b" }, { signal: signal() });
    expect(first.entries).toEqual(firstExpected);
    expect(second.entries).toEqual(secondExpected);
    expect(first.entries[0]?.time).not.toBe(second.entries[0]?.time);
  });

  it("preserves Invalid Date strings instead of throwing Intl RangeError", async () => {
    const entries = ["not-a-date", "", "2026-99-99", "2026-10-02T00:00:00Z"].map(entry);
    const expected = entries.map(toLogEntry);
    respond(entries);
    const result = await fetchLiveLogs({ principalId: "principal" }, { signal: signal() });
    expect(result.entries).toEqual(expected);
    expect(result.entries.slice(0, 3).map((row) => row.time)).toEqual([
      "Invalid Date",
      "Invalid Date",
      "Invalid Date",
    ]);
  });

  it("preserves property read order and the original timestamp error identity", async () => {
    const originalError = new Error("timestamp access failed");
    const reads: string[] = [];
    const value = entry("2026-10-02T00:00:00Z");
    Object.defineProperty(value, "id", {
      get: () => {
        reads.push("id");
        return "id";
      },
    });
    Object.defineProperty(value, "timestamp", {
      get: () => {
        reads.push("timestamp");
        throw originalError;
      },
    });
    respond([value]);
    await expect(fetchLiveLogs({ principalId: "principal" }, { signal: signal() })).rejects.toBe(
      originalError,
    );
    expect(reads).toEqual(["id", "timestamp"]);
  });

  it("preserves HTTP errors and request cancellation identity", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(fetchLiveLogs({ principalId: "principal" }, { signal: signal() })).rejects.toThrow(
      "Operations log request failed (503).",
    );
    const originalError = new Error("cancelled");
    const requestSignal = signal();
    const request = vi.fn().mockRejectedValue(originalError);
    vi.stubGlobal("fetch", request);
    await expect(
      fetchLiveLogs({ principalId: "principal" }, { signal: requestSignal }),
    ).rejects.toBe(originalError);
    expect(request).toHaveBeenCalledWith("/api/operations/logs?limit=80", {
      signal: requestSignal,
      credentials: "same-origin",
    });
  });

  it("preserves JSON parse errors and standalone mapper behavior", async () => {
    const originalError = new SyntaxError("invalid JSON");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw originalError;
        },
      }),
    );
    await expect(fetchLiveLogs({ principalId: "principal" }, { signal: signal() })).rejects.toBe(
      originalError,
    );
    const value = entry("not-a-date");
    expect(toLogEntry(value)).toEqual({
      id: "log-0",
      time: "Invalid Date",
      service: "gateway",
      route: "/requests/0",
      severity: "info",
      latency: 0,
      requestId: "request-0",
      message: "message-0",
    });
  });
});
