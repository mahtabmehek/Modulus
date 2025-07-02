/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
