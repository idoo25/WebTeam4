import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment optimization
  output: "standalone",

  // Image optimization for Vercel
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Environment variables validation at build time
  env: {
    // These will be available at build time
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "TeamInsight",
  },

  // Experimental features
  experimental: {
    // Enable server actions for better form handling
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/lecturer",
        destination: "/lecturer/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
