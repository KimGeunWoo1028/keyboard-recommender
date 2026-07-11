import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Internal debug UI is opt-in so accidental deploys do not expose ``/debug``.
 * Set ``NEXT_PUBLIC_INTERNAL_DEBUG=1`` in ``.env.local`` for local use.
 *
 * Auth gating for recommendation flows is handled in ``RequireAuth`` (client) via ``GET /auth/me``,
 * because the session cookie is usually set on the **API** host while this app runs on another origin/port.
 * Middleware cannot see that cookie, so a cookie-only redirect here would either do nothing or trap users
 * after login in some setups.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/debug") && process.env.NEXT_PUBLIC_INTERNAL_DEBUG !== "1") {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
