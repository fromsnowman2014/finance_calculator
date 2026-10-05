import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Vercel restores .next/cache between builds; the persistent Turbopack cache once
    // shipped a stale globals.css (new utilities, old theme tokens). Always compile fresh.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
