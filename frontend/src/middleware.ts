import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { applySecurityHeaders } from "@/lib/security-headers";

/**
 * Internal debug UI is opt-in so accidental deploys do not expose ``/debug``.
 * Set ``NEXT_PUBLIC_INTERNAL_DEBUG=1`` in ``.env.local`` for local use.
 *
 * Session cookies live on the **API** host, so this middleware cannot enforce
 * login redirects. ``RequireAuth`` (client, ``GET /auth/me``) gates ``/mypage``
 * only; ``/recommend`` and ``/results`` stay guest-accessible by product design.
 */
function isHttpsRequest(request: NextRequest): boolean {
  if (request.nextUrl.protocol === "https:") return true;
  const forwarded = request.headers.get("x-forwarded-proto");
  return forwarded?.split(",")[0]?.trim() === "https";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const https = isHttpsRequest(request);

  if (pathname.startsWith("/debug") && process.env.NEXT_PUBLIC_INTERNAL_DEBUG !== "1") {
    const notFound = new NextResponse("Not found", { status: 404 });
    applySecurityHeaders(notFound, { isHttps: https });
    return notFound;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response, { isHttps: https });
  return response;
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
