import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { generateKeyPairSync } from "node:crypto";

const port = 43_128;
const privateKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({
  format: "jwk",
});
let child: ChildProcess;

beforeAll(async () => {
  child = spawn(process.execPath, ["dist/server/server.js"], {
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "production",
      DESTROYER_DB_PATH: ":memory:",
      DESTROYER_JWT_PRIVATE_KEY: JSON.stringify(privateKey),
      DESTROYER_JWT_KID: "destroyer-production-tests",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Production server did not start")), 5_000);
    child.once("exit", (code) => reject(new Error(`Production server exited with ${code}`)));
    child.stdout?.on("data", (chunk) => {
      if (String(chunk).includes("Destroyer listening")) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
});

afterAll(async () => {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => child.once("exit", () => resolve()));
});

describe("Destroyer production artifact", () => {
  it("should serve exact asset bytes given a hashed asset when requesting production output", async () => {
    const name = readdirSync("dist/assets").find((value) => value.endsWith(".js"));
    expect(name).toBeTruthy();
    const response = await fetch(`http://127.0.0.1:${port}/assets/${name}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/javascript");
    expect(response.headers.get("cache-control")).toContain("immutable");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(readFileSync(`dist/assets/${name}`));
  });

  it("should keep assets pages and APIs distinct given missing production requests", async () => {
    expect((await fetch(`http://127.0.0.1:${port}/assets/missing.js`)).status).toBe(404);
    expect((await fetch(`http://127.0.0.1:${port}/missing-page`)).status).toBe(404);
    const api = await fetch(`http://127.0.0.1:${port}/api/missing`);
    expect(api.status).toBe(404);
    expect(api.headers.get("content-type")).toContain("application/problem+json");
  });

  it("should include route content given an SSR request when serving production", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Design system baseline");
  });
});
