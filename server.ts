import { resolve } from "node:path";
import { serve } from "@askrjs/node";
import app from "virtual:askr-server";
import { getConfig } from "./src/server/config";

const config = getConfig();
const running = await serve(app, {
  port: config.port,
  host: config.host,
  assets: { root: resolve(process.cwd(), "dist") },
});
console.log(`Destroyer listening on ${running.url}`);
