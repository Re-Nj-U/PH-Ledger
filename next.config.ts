import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preserve the approved repository instructions during development.
  agentRules: false,
  // Private authenticated reads will be introduced in a later phase.
  // Keep component caching opt-in instead of inheriting the scaffold default.
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
