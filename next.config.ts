import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Real product thumbnails come from many retailer CDNs (BHX, GO!, MM,
    // Lotte, WinMart...) — allow any https host.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // NFR-14: enforce HTTPS once deployed.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // NOTE: Content-Security-Policy is set per-request in middleware.ts using a
          // nonce, so Next.js hydration scripts work without 'unsafe-inline' (NFR-19).
        ],
      },
    ];
  },
};

export default nextConfig;
