import { defineConfig } from "vite-plus";
import { askr } from "@askrjs/vite";
import { askrServer } from "@askrjs/vite/server";

export default defineConfig({
  plugins: [
    askr({ optimizeTemplates: true }),
    askrServer({ entry: "./src/server/entry-server.ts" }),
  ],
  lint: { ignorePatterns: ["dist/**", "node_modules/**", "coverage/**"] },
  test: {
    exclude: ["tests/browser/**", "tests/production.test.ts", "node_modules/**", "dist/**"],
  },
  build: { manifest: true, sourcemap: "hidden" },
});
