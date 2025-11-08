import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@calenote/shared'],
  // Turbopack configuration (replaces webpack config)
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
};

export default nextConfig;
