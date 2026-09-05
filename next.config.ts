import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "556adz76.us-east.insforge.app",
        pathname: "/api/storage/buckets/pdh_media/objects/**",
      },
    ],
  },
};

export default nextConfig;
