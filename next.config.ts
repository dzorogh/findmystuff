import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['turbopack-inline-svg-loader'],
        condition: {
          content: /^[\s\S]{0,20000}$/, // <-- Inline SVGs smaller than ~20Kb (since Next.js v16)
        },
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
