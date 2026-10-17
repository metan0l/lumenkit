import type { NextConfig } from "next";

// Общий .env лежит в корне монорепо (Next сам читает только apps/web/.env*)
try {
  process.loadEnvFile("../../.env");
} catch {}

const nextConfig: NextConfig = {
  devIndicators: false,
  // Пакеты воркспейса отдаются исходниками TS — Next транспилирует их сам
  transpilePackages: ["@lumenkit/core", "@lumenkit/db", "@lumenkit/jobs", "@lumenkit/storage"],
  // BullMQ читает свои Lua-скрипты с диска — его нельзя бандлить
  serverExternalPackages: ["bullmq", "ioredis"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
