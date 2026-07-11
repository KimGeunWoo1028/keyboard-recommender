import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence monorepo false-positive when a parent directory also has a lockfile.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.imweb.me",
        pathname: "/thumbnail/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8010",
        pathname: "/media/swagkey-images/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8010",
        pathname: "/media/swagkey-images/**",
      },
    ],
  },
  /**
   * Optional: proxy browser ``/api/*`` to FastAPI during ``next dev`` so you can omit
   * ``NEXT_PUBLIC_API_URL``. Set e.g. ``INTERNAL_API_PROXY_TARGET=http://127.0.0.1:8000`` in ``.env.local``.
   */
  async rewrites() {
    const target = process.env.INTERNAL_API_PROXY_TARGET?.replace(/\/$/, "");
    if (!target) {
      return [];
    }
    return [
      { source: "/api/:path*", destination: `${target}/api/:path*` },
      { source: "/media/:path*", destination: `${target}/media/:path*` },
    ];
  },
};

export default nextConfig;
