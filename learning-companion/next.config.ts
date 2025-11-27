import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateBuildId: async () => {
    // Force unique ID for production
    if (process.env.VERCEL_ENV === 'production') {
      return `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`
  },
}

export default nextConfig;
