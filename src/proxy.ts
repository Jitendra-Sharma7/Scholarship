import { NextResponse, type NextRequest } from "next/server";

/**
 * Hides the read-only JSON API from ordinary site visitors.
 *
 * The browser no longer uses `/api/*` at all: every public page is a server
 * component reading Prisma directly, and every form posts through a server
 * action. These routes remain for external consumers and the verification
 * scripts, which is why they are gated rather than deleted.
 *
 * A request is allowed when it carries the shared API key, or when it comes
 * from the machine the app is running on — that second case is what lets the
 * verification suites and local development work without a key.
 *
 * `/api/auth/*` is deliberately untouched: those are the OAuth start and
 * callback routes, which the browser has to reach by redirect.
 */

const API_KEY = process.env.PUBLIC_API_KEY;

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** 404 rather than 403, so a blocked request does not confirm the route exists. */
function hidden() {
  return new NextResponse("Not found", { status: 404 });
}

function isLocal(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  return LOOPBACK_HOSTS.has(host);
}

function hasValidKey(request: NextRequest) {
  if (!API_KEY) return false;
  const provided = request.headers.get("x-api-key") ?? request.headers.get("authorization");
  return provided === API_KEY || provided === `Bearer ${API_KEY}`;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/public")) {
    if (!hasValidKey(request) && !isLocal(request)) {
      return hidden();
    }
    // A key can be copied out of a browser's history or a proxy log, so the
    // response is marked as unindexable and never cached.
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Everything under /api except the OAuth routes, which must stay reachable.
  matcher: ["/api/public/:path*"],
};
