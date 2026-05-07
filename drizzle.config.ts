import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Use standard pg driver for CLI migrations (neon serverless requires WebSocket
  // and only works at runtime, not in the drizzle-kit CLI context)
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: false,
} satisfies Config;
