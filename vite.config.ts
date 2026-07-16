import { defineConfig } from "vite-plus";
import { askr } from "@askrjs/vite";
import { askrServer } from "@askrjs/vite/server";

export default defineConfig({
  resolve: { preserveSymlinks: true, dedupe: ["@askrjs/askr", "@askrjs/ui"] },
  plugins: [
    askr({ optimizeTemplates: true }),
    askrServer({ entry: "./src/server/entry-server.ts" }),
  ],
  lint: { ignorePatterns: ["dist/**", "node_modules/**", "coverage/**"] },
  test: { exclude: ["tests/browser/**", "node_modules/**", "dist/**"] },
  build: { manifest: true, sourcemap: "hidden" },
});
