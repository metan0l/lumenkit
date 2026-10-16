import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Пакеты воркспейса отдаются исходниками TS — Next транспилирует их сам
  transpilePackages: ["@lumenkit/core"],
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
