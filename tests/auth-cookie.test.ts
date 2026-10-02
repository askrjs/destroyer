import { createJwtIssuer } from "@askrjs/auth/jwt";
import { generateKeyPairSync } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/server/app";
import { createDependencies } from "../src/server/dependencies";

const privateKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({
  format: "jwk",
});
const issuer = createJwtIssuer({
  privateKey,
  kid: "destroyer-cookie-tests",
  issuer: "destroyer",
  audience: "destroyer-browser",
  ttlSeconds: 8 * 60 * 60,
  clock: () => 1_000,
});

describe("Destroyer session cookie environment", () => {
  const opened: ReturnType<typeof createDependencies>[] = [];
  afterEach(() => {
    opened.splice(0).forEach((dependencies) => dependencies.lifecycle.close());
    vi.unstubAllEnvs();
  });

  it.each([
    { environment: "development", secure: false },
    { environment: "test", secure: false },
    { environment: "production", secure: true },
    { environment: "staging", secure: true },
    { environment: undefined, secure: true },
  ])(
    "should use Secure=$secure given NODE_ENV=$environment for signup and login",
    async ({ environment, secure }) => {
      vi.stubEnv("NODE_ENV", environment);
      const dependencies = createDependencies({ path: ":memory:" });
      opened.push(dependencies);
      const app = createApp(dependencies, issuer);
      for (const path of ["/auth/v1/accounts", "/auth/v1/session"]) {
        const response = await app.fetch(
          new Request(`http://destroyer.test${path}`, {
            method: "POST",
            headers: { origin: "http://destroyer.test", "content-type": "application/json" },
            body: JSON.stringify({ email: "cookie@example.test", password: "destroyer" }),
          }),
        );
        expect(response.status).toBe(path.endsWith("accounts") ? 201 : 200);
        const cookie = response.headers.get("set-cookie");
        expect(cookie).toMatch(/^destroyer-session=/u);
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("SameSite=Lax");
        expect(cookie).toContain("Path=/");
        expect(cookie).toContain("Max-Age=28800");
        expect(/(?:^|;)\s*Secure(?:;|$)/u.test(cookie ?? "")).toBe(secure);
      }
    },
  );
});
