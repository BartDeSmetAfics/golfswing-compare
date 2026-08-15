import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    // Allow R2 presigned URLs (any hostname)
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
    ],
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
})(nextConfig);
