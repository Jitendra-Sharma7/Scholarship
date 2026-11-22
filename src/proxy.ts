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
 * Content Security Policy.
 *
 * Next.js App Router emits inline bootstrap and hydration scripts (for example
 * the one that sets `self.__next_r`, the React Flight request id). Those inline
 * scripts carry a per-request nonce, so `script-src` must allow that nonce or
 * the whole app fails to hydrate: the server-rendered HTML is delivered and
 * visible, but no client JavaScript runs, so every interactive control (the
 * cookie-consent buttons included) is dead. The nonce is generated per request
 * and propagated to the app so Next.js stamps it onto its own script tags.
 */
function buildCsp(nonce: string): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://pagead2.googlesyndication.com",
    "https://googleads.g.doubleclick.net",
  ].join(" ");

  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src": scriptSrc,
    "script-src-elem": scriptSrc,
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

  return Object.entries(directives)
    .map(([key, value]) => `${key} ${value}`)
    .join("; ");
}

/** HSTS only makes sense over HTTPS; skip it in local development. */
function hstsHeader(): string | null {
  if (isDev) return null;
  return "max-age=31536000; includeSubDomains; preload";
}

function applySecurityHeaders(response: NextResponse, csp: string): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set("Content-Security-Policy", csp);
  const hsts = hstsHeader();
  if (hsts) response.headers.set("Strict-Transport-Security", hsts);
  return response;
}

/**
 * Forward the request with the nonce attached. Next.js reads the nonce from the
 * request (both the `x-nonce` header and the request CSP) and stamps it onto
 * every script tag it emits for this render, which is what lets its inline
 * bootstrap/hydration scripts run under the CSP instead of being blocked.
 */
function forwardWithNonce(request: NextRequest, nonce: string, csp: string): Headers {
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  return headers;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A fresh, unguessable nonce per response. Next.js requires a nonce (or
  // 'unsafe-inline') in `script-src` to allow its own inline scripts to run;
  // without it the app ships HTML that never hydrates and no button works.
  const nonce = crypto.randomUUID();
  const csp = buildCsp(nonce);
  const requestHeaders = forwardWithNonce(request, nonce, csp);

  if (pathname.startsWith("/api/public")) {
    if (!hasValidKey(request) && !isLocal(request)) {
      return hidden();
    }
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
    return applySecurityHeaders(response, csp);
  }

  return applySecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    csp
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp)$).*)",
  ],
};
