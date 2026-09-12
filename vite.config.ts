import { defineConfig } from "vite-plus";
import { askr } from "@askrjs/vite";
import { askrServer } from "@askrjs/vite/server";

export default defineConfig({
  plugins: [
    askr({ optimizeTemplates: true }),
    askrServer({ entry: "./src/server/entry-server.ts" }),
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    allowedHosts: ["127.0.0.1", "localhost", "[::1]"],
  },
  lint: { ignorePatterns: ["dist/**", "node_modules/**", "coverage/**"] },
  test: {
    exclude: [
      "tests/browser/**",
      "tests/visual/**",
      "tests/production.test.ts",
      "node_modules/**",
      "dist/**",
      // Agent worktrees are full checkouts of this repo; without this their
      // copies of every suite get discovered alongside the real ones.
      "**/.claude/**",
    ],
  },
  build: { manifest: true, sourcemap: "hidden" },
});
