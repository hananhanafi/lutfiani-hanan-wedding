import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    proxyClientMaxBodySize: "50mb",
  },
  // Increase API route body size for video/audio uploads
  serverExternalPackages: ["sharp"],
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "192.168.*",
    "10.*",
    "172.*",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "wedding-media.hananhanafi.com",
      },
    ],
  },
};

export default nextConfig;
