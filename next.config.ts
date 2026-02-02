import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.twcstorage.ru",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "b536986d-storage.s3.twcstorage.ru",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ahrcamkpmbqoxbgamddp.supabase.co",
        pathname: "/**",
      }
    ],
    // Используем unoptimized для внешних изображений, чтобы избежать проблем с оптимизацией
    unoptimized: false,
  },
};

export default nextConfig;
