/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@calenote/shared'],
  // Turbopack configuration (replaces webpack config)
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
};

export default nextConfig;
