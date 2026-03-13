/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  cacheComponents: true,
  experimental: {
    exposeDevToolsInProductionBuild: true,
  },
}

module.exports = nextConfig
