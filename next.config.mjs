/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Node.js 22+ / OpenSSL 3: webpack's default md4 hash can pass undefined and crash builds.
    if (config.output) {
      config.output.hashFunction = 'sha256'
    }
    return config
  },
}

export default nextConfig
