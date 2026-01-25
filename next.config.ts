import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Legacy - mantener durante migración
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev', // Cloudflare R2 public URLs
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com', // Cloudflare R2 direct
      },
    ],
  },
};

export default nextConfig;
