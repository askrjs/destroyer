import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["tests/production.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
  },
});
