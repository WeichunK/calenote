/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone mode - causes issues in monorepo with Zeabur
  transpilePackages: ['@calenote/shared'],
  // Turbopack configuration (replaces webpack config)
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
};

export default nextConfig;
