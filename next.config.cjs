/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/api',       destination: '/spec', permanent: true },
      { source: '/checklist', destination: '/demo', permanent: true },
    ]
  },
}

module.exports = nextConfig
