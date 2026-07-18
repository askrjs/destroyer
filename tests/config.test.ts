import { describe, expect, it } from "vitest";
import { parseConfig } from "../src/server/config";

describe("Destroyer startup configuration", () => {
  it("should parse normalized values given a complete environment", () => {
    const config = parseConfig({
      NODE_ENV: "test",
      HOST: " 127.0.0.1 ",
      PORT: "4179",
      DESTROYER_DB_PATH: ":memory:",
      DESTROYER_JWT_KID: "tests",
    });
    expect(config).toMatchObject({
      environment: "test",
      host: "127.0.0.1",
      port: 4179,
      databasePath: ":memory:",
      jwtKeyId: "tests",
    });
  });

  it.each(["0", "65536", "not-a-port"])("should reject invalid ports given PORT=%s", (port) =>
    expect(() => parseConfig({ PORT: port })).toThrow("PORT must be an integer"),
  );

  it("should require an explicit private key given production startup", () => {
    expect(() => parseConfig({ NODE_ENV: "production" })).toThrow(
      "DESTROYER_JWT_PRIVATE_KEY is required in production",
    );
  });

  it("should reject invalid key JSON given configured JWT material", () => {
    expect(() => parseConfig({ DESTROYER_JWT_PRIVATE_KEY: "not-json" })).toThrow(
      "must contain valid JWK JSON",
    );
  });
});
