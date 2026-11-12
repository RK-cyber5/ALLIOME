import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: frontendRoot,
  },
  // Keep the demo view clean — hide the Next.js dev-tools indicator.
  devIndicators: false,
  reactStrictMode: false,
};

export default nextConfig;
