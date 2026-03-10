import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "*.r2.dev",
        protocol: "https",
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
