/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  serverExternalPackages: ['sharp'],
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
}

module.exports = nextConfig
