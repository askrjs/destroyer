import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import { askr } from "@askrjs/vite";

const appDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    askr({
      optimizeTemplates: true,
    }),
  ],
  build: {
    manifest: true,
  },
  server: {
    fs: {
      allow: [resolve(appDirectory, ".."), resolve(appDirectory, "../..")],
    },
  },
});
