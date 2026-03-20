import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["test/smoke/**", "node_modules/**"]
  }
});
