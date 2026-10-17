import { defineConfig } from "drizzle-kit";

// .env лежит в корне монорепо
try {
  process.loadEnvFile("../../.env");
} catch {}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
