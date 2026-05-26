import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["lib/data.ts", "lib/schemas.ts", "lib/cron.ts"],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80
      }
    }
  }
});

