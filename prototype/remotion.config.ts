import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/remotion/index.tsx");
Config.setPublicDir("./public");
Config.setVideoImageFormat("jpeg");

// Алиас @/ как в Next (tsconfig paths)
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: { ...(config.resolve?.alias ?? {}), "@": path.join(process.cwd(), "src") },
  },
}));
