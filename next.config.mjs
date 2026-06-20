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
    // Avoid WasmHash crashes on Node.js 22+ (uses sha256 instead of wasm-based md4)
    config.output.hashFunction = 'sha256'
    return config
  },
}

export default nextConfig
