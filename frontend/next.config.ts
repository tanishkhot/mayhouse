import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix monorepo/workspace root inference (multiple lockfiles).
  // Keep tracing within the frontend directory to avoid picking up unrelated lockfiles.
  outputFileTracingRoot: path.join(__dirname),
  /* Performance optimizations */
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Compress responses
  compress: true,
  webpack: (config) => {
    // These are optional deps for certain wallet libs. In our web build we don't need them,
    // but webpack requires resolvable modules when they are referenced.
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@react-native-async-storage/async-storage": path.join(__dirname, "src/shims/async-storage.ts"),
      "pino-pretty": path.join(__dirname, "src/shims/pino-pretty.ts"),
    };
    return config;
  },
};

export default nextConfig;
