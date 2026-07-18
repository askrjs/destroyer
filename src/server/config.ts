import { generateKeyPairSync } from "node:crypto";

export interface DestroyerConfig {
  readonly host: string;
  readonly port: number;
  readonly databasePath: string;
  readonly jwtPrivateKey: JsonWebKey;
  readonly jwtKeyId: string;
  readonly environment: "development" | "test" | "production";
}

function requiredText(value: string | undefined, name: string, fallback?: string): string {
  const normalized = value?.trim() || fallback;
  if (!normalized) throw new Error(`${name} must be a non-empty string.`);
  return normalized;
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return port;
}

function parseEnvironment(value: string | undefined): DestroyerConfig["environment"] {
  if (!value || value === "development") return "development";
  if (value === "test" || value === "production") return value;
  throw new Error("NODE_ENV must be development, test, or production.");
}

function parsePrivateKey(value: string | undefined, production: boolean): JsonWebKey {
  if (!value) {
    if (production) throw new Error("DESTROYER_JWT_PRIVATE_KEY is required in production.");
    return generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ format: "jwk" });
  }
  let key: unknown;
  try {
    key = JSON.parse(value);
  } catch {
    throw new Error("DESTROYER_JWT_PRIVATE_KEY must contain valid JWK JSON.");
  }
  if (!key || typeof key !== "object" || (key as JsonWebKey).kty !== "RSA") {
    throw new Error("DESTROYER_JWT_PRIVATE_KEY must contain an RSA private JWK.");
  }
  return key as JsonWebKey;
}

export function parseConfig(environment: NodeJS.ProcessEnv): DestroyerConfig {
  const nodeEnvironment = parseEnvironment(environment.NODE_ENV);
  return Object.freeze({
    host: requiredText(environment.HOST, "HOST", "127.0.0.1"),
    port: parsePort(environment.PORT),
    databasePath: requiredText(
      environment.DESTROYER_DB_PATH,
      "DESTROYER_DB_PATH",
      ".data/destroyer.sqlite",
    ),
    jwtPrivateKey: parsePrivateKey(
      environment.DESTROYER_JWT_PRIVATE_KEY,
      nodeEnvironment === "production",
    ),
    jwtKeyId: requiredText(
      environment.DESTROYER_JWT_KID,
      "DESTROYER_JWT_KID",
      "destroyer-development",
    ),
    environment: nodeEnvironment,
  });
}

let cached: DestroyerConfig | undefined;

export function getConfig(): DestroyerConfig {
  cached ??= parseConfig(process.env);
  return cached;
}
