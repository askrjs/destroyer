import { resolve } from "node:path";
import { serve } from "@askrjs/node";
import app from "virtual:askr-server";

const port = Number(process.env.PORT ?? 3000);
const running = await serve(app, {
  port,
  host: process.env.HOST ?? "127.0.0.1",
  assets: { root: resolve(process.cwd(), "dist") },
});
console.log(`Destroyer listening on ${running.url}`);
