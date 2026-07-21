import path from "node:path";

import type { NextConfig } from "next";

const emptyModule = path.join(__dirname, "src/lib/empty-module.js");
const nextPolyfillModule = path.join(
  __dirname,
  "node_modules/next/dist/build/polyfills/polyfill-module.js",
);

type ImageRemotePattern = {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
};

/** Allow next/image to optimize /media/swagkey-images from API / proxy hosts. */
function mediaRemotePatternsFromEnv(): ImageRemotePattern[] {
  const patterns: ImageRemotePattern[] = [];
  const seen = new Set<string>();
  for (const raw of [process.env.NEXT_PUBLIC_API_URL, process.env.INTERNAL_API_PROXY_TARGET]) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    try {
      const u = new URL(trimmed);
      const protocol = u.protocol === "http:" || u.protocol === "https:" ? u.protocol.slice(0, -1) : null;
      if (protocol !== "http" && protocol !== "https") continue;
      const key = `${protocol}|${u.hostname}|${u.port}|/media/swagkey-images/**`;
      if (seen.has(key)) continue;
      seen.add(key);
      patterns.push({
        protocol,
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
        pathname: "/media/swagkey-images/**",
      });
    } catch {
      /* ignore invalid env URL */
    }
  }
  return patterns;
}

const nextConfig: NextConfig = {
  // Silence monorepo false-positive when a parent directory also has a lockfile.
  outputFileTracingRoot: path.join(__dirname),
  /**
   * When `/media` is rewritten via INTERNAL_API_PROXY_TARGET, expose a public
   * flag so `resolveCatalogImageUrl` keeps relative `/media/...` on SSR and in
   * the browser (INTERNAL_* is server-only and previously caused React #418).
   * Explicit NEXT_PUBLIC_MEDIA_SAME_ORIGIN wins when already set.
   */
  env: {
    ...(process.env.INTERNAL_API_PROXY_TARGET?.trim() &&
    process.env.NEXT_PUBLIC_MEDIA_SAME_ORIGIN === undefined
      ? { NEXT_PUBLIC_MEDIA_SAME_ORIGIN: "1" }
      : {}),
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // Inline Tailwind CSS into HTML to remove the render-blocking stylesheet round-trip.
    inlineCss: true,
  },
  /**
   * Next injects ~11 KiB of legacy polyfills (flat/at/fromEntries/…) even for modern
   * browsers. Alias that module away — targets match Next's supported browsers
   * (Chrome/Edge/Firefox 111+, Safari 16.4+).
   */
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      [nextPolyfillModule]: emptyModule,
      "next/dist/build/polyfills/polyfill-module": emptyModule,
      "next/dist/build/polyfills/polyfill-module.js": emptyModule,
    };
    return config;
  },
  images: {
    formats: ["image/avif", "image/webp"],
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
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/swagkey-images/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/swagkey-images/**",
      },
      ...mediaRemotePatternsFromEnv(),
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
      { source: "/health", destination: `${target}/health` },
      { source: "/api/:path*", destination: `${target}/api/:path*` },
      { source: "/media/:path*", destination: `${target}/media/:path*` },
    ];
  },
};

export default nextConfig;
