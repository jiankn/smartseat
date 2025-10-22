const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  // Monorepo 支持：选择需要转译的 workspace 包（当前无需开启）
  transpilePackages: ['@smartseat/types', '@smartseat/utils', '@smartseat/db'],
  output: 'standalone',
  webpack(config) {
    config.plugins = config.plugins || [];
    config.plugins.push(new PrismaPlugin());
    return config;
  }
};

module.exports = nextConfig;
