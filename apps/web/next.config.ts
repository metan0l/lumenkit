import type { NextConfig } from "next";

// Общий .env лежит в корне монорепо (Next сам читает только apps/web/.env*)
try {
  process.loadEnvFile("../../.env");
} catch {}

const nextConfig: NextConfig = {
  devIndicators: false,
  // Пакеты воркспейса отдаются исходниками TS — Next транспилирует их сам
  transpilePackages: ["@lumenkit/core", "@lumenkit/db", "@lumenkit/storage"],
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
