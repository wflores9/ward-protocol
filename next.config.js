/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      { source: '/api',       destination: '/spec', permanent: true },
      { source: '/checklist', destination: '/demo', permanent: true },
    ]
  },
}

module.exports = nextConfig
