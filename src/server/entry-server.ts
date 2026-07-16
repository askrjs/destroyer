import { createApp } from "./app";
import { createDependencies } from "./dependencies";
import { createJwtIssuer } from "@askrjs/auth/jwt";
import { generateKeyPairSync } from "node:crypto";

function configuredIssuer() {
  const configured = process.env.DESTROYER_JWT_PRIVATE_KEY;
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("DESTROYER_JWT_PRIVATE_KEY is required in production.");
  }
  const privateKey = configured
    ? JSON.parse(configured)
    : generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ format: "jwk" });
  return createJwtIssuer({
    privateKey,
    kid: process.env.DESTROYER_JWT_KID ?? "destroyer-development",
    issuer: "destroyer",
    audience: "destroyer-browser",
    ttlSeconds: 8 * 60 * 60,
  });
}

const dependencies = createDependencies();
const app = createApp(dependencies, configuredIssuer());
export { app };
export default app;
