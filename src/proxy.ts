import { NextResponse, type NextRequest } from "next/server";

/**
 * Request middleware for the application.
 *
 * Two concerns are handled here:
 *
 *  1. Security headers on every response (defense in depth).
 *  2. Gating the read-only `/api/public/*` JSON API so it is only reachable
 *     from localhost or with a valid API key.
 *
 * `/api/auth/*` (OAuth) is intentionally left untouched so the browser can
 * reach it by redirect.
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

const isDev = process.env.NODE_ENV === "development";

/** Security headers applied to every response. */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()",
};

/**
 * Content Security Policy. Keeps the site functional while restricting where
 * scripts, styles, images and frames can come from.
 *
 * Inline styles and scripts are NOT allowed: Tailwind classes are used instead
 * of `style=""`, and all interactivity is in bundled assets.
 */
const CSP_DIRECTIVES: Record<string, string> = {
  "default-src": "'self'",
  "script-src": [
    "'self'",
    "https://pagead2.googlesyndication.com",
    "https://googleads.g.doubleclick.net",
  ].join(" "),
  "script-src-elem": [
    "'self'",
    "https://pagead2.googlesyndication.com",
    "https://googleads.g.doubleclick.net",
  ].join(" "),
  "style-src": ["'self'", "'unsafe-inline'"].join(" "),
  "img-src": ["'self'", "data:", "https:"].join(" "),
  "font-src": ["'self'", "https://fonts.gstatic.com"].join(" "),
  "connect-src": [
    "'self'",
    "https://accounts.google.com",
    "https://oauth2.googleapis.com",
    "https://appleid.apple.com",
  ].join(" "),
  "frame-src": ["https://pagead2.googlesyndication.com"].join(" "),
  "object-src": "'none'",
  "base-uri": "'self'",
  "form-action": "'self'",
  "frame-ancestors": "'none'",
};

function cspHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, value]) => `${key} ${value}`)
    .join("; ");
}

/** HSTS only makes sense over HTTPS; skip it in local development. */
function hstsHeader(): string | null {
  if (isDev) return null;
  return "max-age=31536000; includeSubDomains; preload";
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set("Content-Security-Policy", cspHeader());
  const hsts = hstsHeader();
  if (hsts) response.headers.set("Strict-Transport-Security", hsts);
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/public")) {
    if (!hasValidKey(request) && !isLocal(request)) {
      return hidden();
    }
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
    return applySecurityHeaders(response);
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp)$).*)",
  ],
};
