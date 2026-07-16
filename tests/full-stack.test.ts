import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApp } from "../src/server/app";
import { createDependencies } from "../src/server/dependencies";
import { createJwtIssuer } from "@askrjs/auth/jwt";
import { generateKeyPairSync } from "node:crypto";

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
  const dependencies = (options?: Parameters<typeof createDependencies>[0]) => {
    const value = createDependencies({ path: ":memory:", ...options });
    opened.push(value);
    return value;
  };
  afterEach(() => opened.splice(0).forEach((value) => value.close()));
  const signup = (
    app: ReturnType<typeof createApp>,
    email = "operator@example.test",
    password = "destroyer",
  ) =>
    app.fetch(
      new Request("http://destroyer.test/auth/v1/accounts", {
        method: "POST",
        headers: { origin: "http://destroyer.test", "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    );

  it("should return operational health given a system request when serving the API", async () => {
    const response = await testApp(dependencies()).fetch(
      new Request("http://destroyer.test/api/health"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("should protect operations data given an anonymous request when serving the API", async () => {
    const response = await testApp(dependencies()).fetch(
      new Request("http://destroyer.test/api/operations/summary"),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
  });

  it("should return operations data given a session when using the workspace API", async () => {
    const app = testApp(dependencies());
    const session = await signup(app);
    const cookie = session.headers.get("set-cookie")?.split(";", 1)[0];
    const response = await app.fetch(
      new Request("http://destroyer.test/api/operations/summary", {
        headers: { cookie: cookie ?? "" },
      }),
    );

    expect(session.status).toBe(201);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      healthyServices: 18,
      degradedServices: 1,
      openIncidents: 2,
      activeOperators: 1,
    });
  });

  it("should validate support payloads given malformed input when creating a contact request", async () => {
    const response = await testApp(dependencies()).fetch(
      new Request("http://destroyer.test/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-email", subject: "x", message: "short" }),
      }),
    );

    expect(response.status).toBe(422);
  });

  it("should expose lifecycle probes given an operational server when checking readiness", async () => {
    const app = testApp(dependencies());
    for (const path of ["/livez", "/readyz", "/startupz", "/targetz"])
      expect((await app.fetch(new Request(`http://destroyer.test${path}`))).status).toBe(200);
  });

  it("should render the operations workspace given a page request when serving SSR", async () => {
    const response = await testApp(dependencies()).fetch(new Request("http://destroyer.test/"));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Design system baseline");
  });

  it("should render not found given an unknown page when serving SSR", async () => {
    const response = await testApp(dependencies()).fetch(
      new Request("http://destroyer.test/missing-page"),
    );
    expect(response.status).toBe(404);
  });

  it("should invalidate a JWT cookie given an app restart when authorizing an API request", async () => {
    let clock = 1_000_000;
    const app = testApp(dependencies({ now: () => clock }));
    const session = await signup(app, "restart@example.test");
    const cookie = session.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
    const restarted = testApp(dependencies({ now: () => clock }));
    expect(
      (
        await restarted.fetch(
          new Request("http://destroyer.test/api/operations/summary", { headers: { cookie } }),
        )
      ).status,
    ).toBe(200);
  });

  it("should preserve records given a database when reopening persistence", async () => {
    const directory = mkdtempSync(join(tmpdir(), "destroyer-"));
    const path = join(directory, "test.sqlite");
    const first = createDependencies({ path });
    await first.contacts.create({
      email: "operator@example.test",
      subject: "Persist me",
      message: "This request survives reopening.",
    });
    first.close();
    const second = createDependencies({ path });
    expect(
      (second.db.prepare("SELECT COUNT(*) count FROM support_requests").get() as { count: number })
        .count,
    ).toBe(1);
    second.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("should validate persist and audit authenticated profile actions", async () => {
    const deps = dependencies();
    const app = testApp(deps);
    const session = await signup(app, "profile@example.test");
    const cookie = session.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
    const settings = await app.fetch(
      new Request("http://destroyer.test/settings", { headers: { cookie } }),
    );
    const html = await settings.text();
    const csrf = html.match(/name="_csrf" value="([^"]+)"/)?.[1];
    expect(csrf).toBeTruthy();

    const invalid = await app.fetch(
      new Request("http://destroyer.test/settings", {
        method: "POST",
        headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          _askr_action: "update-profile",
          _csrf: csrf ?? "",
          displayName: "x",
          version: "1",
        }),
      }),
    );
    expect(invalid.status).toBe(422);
    expect(await invalid.text()).toContain("x");

    const updated = await app.fetch(
      new Request("http://destroyer.test/settings", {
        method: "POST",
        headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          _askr_action: "update-profile",
          _csrf: csrf ?? "",
          displayName: "Grace Hopper",
          version: "1",
        }),
      }),
    );
    expect(updated.status).toBe(303);
    const principalId = (deps.db.prepare("SELECT id FROM principals").get() as { id: string }).id;
    expect(await deps.profiles.get(principalId)).toEqual({
      displayName: "Grace Hopper",
      version: 2,
    });
    expect(
      (
        deps.db
          .prepare("SELECT COUNT(*) count FROM audit_events WHERE action='profile.update'")
          .get() as { count: number }
      ).count,
    ).toBe(1);
  });
});
