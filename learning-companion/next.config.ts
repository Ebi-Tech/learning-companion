import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`
  },
  // chunk handling
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
      }
    }
    return config
  }
}

export default nextConfig;
