import { createJwtIssuer } from "@askrjs/auth/jwt";
import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/server/app";
import { createDependencies } from "../src/server/dependencies";

const privateKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({
  format: "jwk",
});
const issuer = createJwtIssuer({
  privateKey,
  kid: "destroyer-tests",
  issuer: "destroyer",
  audience: "destroyer-browser",
  ttlSeconds: 8 * 60 * 60,
  clock: () => 1_000,
});
const testApp = (dependencies: ReturnType<typeof createDependencies>) =>
  createApp(dependencies, issuer);

describe("Destroyer full stack", () => {
  const opened: ReturnType<typeof createDependencies>[] = [];
  const temporaryDirectories: string[] = [];
  const dependencies = (options?: Parameters<typeof createDependencies>[0]) => {
    const value = createDependencies({ path: ":memory:", ...options });
    opened.push(value);
    return value;
  };
  afterEach(() => {
    opened.splice(0).forEach((value) => value.lifecycle.close());
    temporaryDirectories
      .splice(0)
      .forEach((directory) => rmSync(directory, { recursive: true, force: true }));
  });

  const signup = async (
    app: ReturnType<typeof createApp>,
    email = "operator@example.test",
    password = "destroyer",
  ) => {
    const response = await app.fetch(
      new Request("http://destroyer.test/auth/v1/accounts", {
        method: "POST",
        headers: { origin: "http://destroyer.test", "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    );
    return {
      response,
      cookie: response.headers.get("set-cookie")?.split(";", 1)[0] ?? "",
    };
  };

  const authenticated = async (app: ReturnType<typeof createApp>, email?: string) => {
    const session = await signup(app, email);
    expect(session.response.status).toBe(201);
    return session.cookie;
  };

  it("should return operational health given a system request when serving the API", async () => {
    const response = await testApp(dependencies()).fetch(
      new Request("http://destroyer.test/api/health"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("should protect workspace data given anonymous requests when serving the API", async () => {
    const app = testApp(dependencies());
    for (const path of [
      "/api/settings",
      "/api/activity",
      "/api/operations/summary",
      "/api/operations/logs",
      "/api/operations/metrics",
      "/api/invoices/sample",
    ]) {
      const response = await app.fetch(new Request(`http://destroyer.test${path}`));
      expect(response.status, path).toBe(401);
      expect(response.headers.get("content-type"), path).toContain("application/problem+json");
    }
  });

  it("should return database-backed operations data given an authenticated request", async () => {
    const app = testApp(dependencies());
    const cookie = await authenticated(app);
    const request = (path: string) =>
      app.fetch(new Request(`http://destroyer.test${path}`, { headers: { cookie } }));

    const summary = await request("/api/operations/summary");
    expect(await summary.json()).toEqual({
      healthyServices: 18,
      degradedServices: 1,
      openIncidents: 2,
      activeOperators: 1,
    });

    const metrics = await request("/api/operations/metrics");
    expect(await metrics.json()).toMatchObject({ requests: 420 });

    const first = await request("/api/operations/logs?limit=12");
    const firstPage = (await first.json()) as {
      entries: Array<{ id: string; route: string }>;
      nextCursor: string;
    };
    expect(firstPage.entries).toHaveLength(12);
    expect(firstPage.nextCursor).toBeTruthy();
    const second = await request(
      `/api/operations/logs?limit=12&cursor=${encodeURIComponent(firstPage.nextCursor)}`,
    );
    const secondPage = (await second.json()) as { entries: Array<{ id: string }> };
    expect(secondPage.entries).toHaveLength(12);
    expect(secondPage.entries[0]?.id).not.toBe(firstPage.entries[0]?.id);

    const filtered = await request(
      "/api/operations/logs?limit=20&route=%2Fapi%2Foperations%2Flogs",
    );
    const filteredPage = (await filtered.json()) as { entries: Array<{ route: string }> };
    expect(filteredPage.entries.every((entry) => entry.route === "/api/operations/logs")).toBe(
      true,
    );
  });

  it("should persist and rate limit contact requests given repeated submissions", async () => {
    const deps = dependencies();
    const app = testApp(deps);
    const contact = () =>
      app.fetch(
        new Request("http://destroyer.test/api/contact", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "192.0.2.4",
          },
          body: JSON.stringify({
            email: "support@example.test",
            subject: "Need help",
            message: "A persisted support request from the integration suite.",
          }),
        }),
      );

    for (let index = 0; index < 3; index += 1) expect((await contact()).status).toBe(201);
    expect((await contact()).status).toBe(429);
    expect(await deps.contacts.count()).toBe(3);
  });

  it("should reject malformed support payloads given invalid contact input", async () => {
    const response = await testApp(dependencies()).fetch(
      new Request("http://destroyer.test/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-email", subject: "x", message: "short" }),
      }),
    );
    expect(response.status).toBe(422);
  });

  it("should preserve accounts and support data given a migrated database when reopening", async () => {
    const directory = mkdtempSync(join(tmpdir(), "destroyer-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "test.sqlite");
    const first = createDependencies({ path });
    await first.accounts.register("saved@example.test", "destroyer");
    await first.contacts.create({
      email: "operator@example.test",
      subject: "Persist me",
      message: "This request survives reopening.",
    });
    first.lifecycle.close();

    const second = createDependencies({ path });
    expect(await second.accounts.authenticate("saved@example.test", "destroyer")).toMatchObject({
      email: "saved@example.test",
    });
    expect(await second.contacts.count()).toBe(1);
    expect(second.health.migrationsCurrent()).toBe(true);
    second.lifecycle.close();
    second.lifecycle.close();
  });

  it("should reject stale settings given concurrent versions when updating preferences", async () => {
    const deps = dependencies();
    const principal = await deps.accounts.register("settings@example.test", "destroyer");
    const first = await deps.settings.update(principal.id, { density: "compact" }, 1);
    const stale = await deps.settings.update(principal.id, { region: "eu-west" }, 1);

    expect(first.kind).toBe("updated");
    expect(stale).toEqual({ kind: "conflict" });
    expect(await deps.settings.get(principal.id)).toMatchObject({ density: "compact", version: 2 });
    expect(await deps.settings.activity(principal.id)).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "settings.update" })]),
    );
  });

  it("should invalidate invite tokens given a current settings version when resetting", async () => {
    const deps = dependencies();
    const principal = await deps.accounts.register("invite@example.test", "destroyer");
    const before = await deps.settings.get(principal.id);
    const result = await deps.settings.resetInvite(principal.id, before?.version ?? 0);

    expect(result.kind).toBe("updated");
    if (result.kind === "updated") {
      expect(result.value.inviteLink).not.toBe(before?.inviteLink);
      expect(result.value.version).toBe(2);
    }
    expect(await deps.settings.activity(principal.id)).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "invite.reset" })]),
    );
  });

  it("should download deterministic CSV given an authenticated billing request", async () => {
    const app = testApp(dependencies());
    const cookie = await authenticated(app, "billing@example.test");
    const response = await app.fetch(
      new Request("http://destroyer.test/api/invoices/sample", { headers: { cookie } }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("destroyer-sample-invoice.csv");
    expect(await response.text()).toBe(
      "invoice_id,issued_at,customer_email,description,amount_usd,status\r\n" +
        "INV-DEMO-001,2026-07-01,billing@example.test,Destroyer workspace,49.00,paid\r\n",
    );
  });

  it("should expose lifecycle probes given an operational server when checking readiness", async () => {
    const app = testApp(dependencies());
    for (const path of ["/livez", "/readyz", "/startupz", "/targetz"])
      expect((await app.fetch(new Request(`http://destroyer.test${path}`))).status).toBe(200);
  });

  it("should render workspace pages and not found responses given SSR requests", async () => {
    const app = testApp(dependencies());
    const response = await app.fetch(new Request("http://destroyer.test/"));
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Design system baseline");
    expect((await app.fetch(new Request("http://destroyer.test/missing-page"))).status).toBe(404);
  });
});
