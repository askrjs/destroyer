import { createApp } from "./app";
import { createDependencies } from "./dependencies";
import { createJwtIssuer } from "@askrjs/auth/jwt";
import { getConfig } from "./config";

function configuredIssuer() {
  const config = getConfig();
  return createJwtIssuer({
    privateKey: config.jwtPrivateKey,
    kid: config.jwtKeyId,
    issuer: "destroyer",
    audience: "destroyer-browser",
    ttlSeconds: 8 * 60 * 60,
  });
}

const config = getConfig();
const dependencies = createDependencies({ path: config.databasePath });
const app = createApp(dependencies, configuredIssuer());
export { app };
export default app;
