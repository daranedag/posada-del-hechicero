import type { NextConfig } from "next";

const imageKitEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim();
const imageKitUrl = imageKitEndpoint ? new URL(imageKitEndpoint) : null;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      ...(imageKitUrl ? [{
        protocol: "https" as const,
        hostname: imageKitUrl.hostname,
        port: imageKitUrl.port,
        pathname: `${imageKitUrl.pathname.replace(/\/+$/, "")}/**`,
        search: "",
      }] : []),
      {
        protocol: "https",
        hostname: "556adz76.us-east.insforge.app",
        pathname: "/api/storage/buckets/pdh_media/objects/**",
      },
    ],
  },
};

export default nextConfig;
