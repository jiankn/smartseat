/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  // Monorepo 支持：转译 workspace 包
  transpilePackages: ['@smartseat/types', '@smartseat/utils', '@smartseat/db'],
  // 输出配置
  output: 'standalone'
};

module.exports = nextConfig;
