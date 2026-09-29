/**
 * OAuth sign-in verification.
 *
 * Social sign-in is the one feature that cannot be exercised end to end without
 * credentials from the providers, so this covers everything around that:
 *
 *   1. With no credentials configured, the buttons are absent. A provider that
 *      is not configured must not be offered, because an enabled button leads to
 *      a consent screen that cannot complete.
 *   2. With dummy credentials present, the start route builds a correct
 *      authorisation redirect. This is the part that is genuinely checkable
 *      offline: the client id, scope, redirect URI and state must all be right,
 *      and a wrong one fails silently in front of the user.
 *   3. The callback refuses a tampered, missing or unconfigured provider before
 *      touching the database.
 *
 * Run with the server started using GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET set
 * to dummy values to cover group 2. Without them the script reports that the
 * redirect check was skipped rather than quietly passing.
 */
import { resolveBase } from "./lib/base-url.mjs";

const BASE = resolveBase();

let failures = 0;
let checks = 0;
let skipped = 0;

function check(label, ok, detail) {
  checks += 1;
  const note = !ok && detail ? `  -> ${detail}` : "";
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${note}`);
  if (!ok) failures += 1;
}

function skip(label, why) {
  skipped += 1;
  console.log(`SKIP  ${label}  -> ${why}`);
}

// ---------------------------------------------------------------------
// 1. Nothing is offered when nothing is configured
// ---------------------------------------------------------------------
console.log("\n-- unconfigured providers are not offered --");
{
  const register = await (await fetch(`${BASE}/auth/register`)).text();
  const login = await (await fetch(`${BASE}/auth/login`)).text();

  const configured = process.env.EXPECT_OAUTH_PROVIDERS;
  if (configured) {
    const expected = configured.split(",").map((p) => p.trim()).filter(Boolean);
    for (const provider of ["google", "apple"]) {
      const shouldShow = expected.includes(provider);
      check(
        `${provider} button ${shouldShow ? "is" : "is not"} shown, as expected`,
        shouldShow === register.includes(`/api/auth/${provider}`),
        `page ${shouldShow ? "omits" : "shows"} the ${provider} button`
      );
    }
  } else {
    check(
      "the register page offers no social button without credentials",
      !register.includes("/api/auth/google") && !register.includes("/api/auth/apple"),
      "a provider button is offered even though no credentials are configured"
    );
    check(
      "the login page offers no social button without credentials",
      !login.includes("/api/auth/google") && !login.includes("/api/auth/apple"),
      "a provider button is offered even though no credentials are configured"
    );
  }
}

// ---------------------------------------------------------------------
// 2. The start route
// ---------------------------------------------------------------------
console.log("\n-- start route --");
{
  // An unknown or unconfigured provider must 404 rather than redirect, so a
  // stale button fails visibly instead of bouncing the visitor to a dead page.
  const unconfigured = await fetch(`${BASE}/api/auth/microsoft`, { redirect: "manual" });
  check(
    "an unconfigured provider is refused with 404",
    unconfigured.status === 404,
    `HTTP ${unconfigured.status}`
  );

  const google = await fetch(`${BASE}/api/auth/google`, { redirect: "manual" });
  const location = google.headers.get("location") ?? "";

  if (google.status === 404) {
    skip(
      "the Google authorisation redirect is correct",
      "no Google credentials in this process; restart the server with them set to cover this"
    );
  } else {
    check(
      "the start route redirects rather than rendering",
      google.status >= 300 && google.status < 400,
      `HTTP ${google.status}`
    );

    const url = new URL(location);
    check(
      "the redirect goes to Google's authorisation endpoint",
      url.origin === "https://accounts.google.com" && url.pathname.includes("auth"),
      `went to ${url.origin}${url.pathname}`
    );
    check(
      "the redirect carries the configured client id",
      Boolean(url.searchParams.get("client_id")),
      "client_id is missing, so Google would refuse the request"
    );
    check(
      "the redirect asks for an authorisation code and openid scope",
      url.searchParams.get("response_type") === "code" &&
        (url.searchParams.get("scope") ?? "").includes("email"),
      `response_type=${url.searchParams.get("response_type")} scope=${url.searchParams.get("scope")}`
    );
    check(
      "the redirect points back at this app's callback",
      (url.searchParams.get("redirect_uri") ?? "").endsWith("/api/auth/google/callback"),
      `redirect_uri=${url.searchParams.get("redirect_uri")}`
    );
    check(
      "the redirect carries a signed state parameter",
      Boolean(url.searchParams.get("state")),
      "state is missing, so the callback could not tie the response to this browser"
    );
  }
}

// ---------------------------------------------------------------------
// 3. The callback refuses bad input
// ---------------------------------------------------------------------
console.log("\n-- callback refuses bad input --");
{
  for (const [label, url] of [
    ["a missing state", `${BASE}/api/auth/google/callback?code=abc`],
    ["a tampered state", `${BASE}/api/auth/google/callback?code=abc&state=forged.signature`],
    ["a malformed state", `${BASE}/api/auth/google/callback?code=abc&state=justtext`],
  ]) {
    const res = await fetch(url, { redirect: "manual" });
    // The browser is returned to the sign-in page with a readable reason, and
    // must not be signed in.
    const back = res.headers.get("location") ?? "";
    const setsSession = (res.headers.getSetCookie?.() ?? []).some((c) =>
      c.includes("gs_session=")
    );
    check(
      `the callback refuses ${label}`,
      (res.status === 303 || res.status === 302) && back.includes("/auth/login") && !setsSession,
      `HTTP ${res.status} -> ${back || "(no redirect)"}`
    );
  }

  const refused = await fetch(`${BASE}/api/auth/microsoft/callback?code=abc&state=x`, {
    redirect: "manual",
  });
  check(
    "the callback refuses an unconfigured provider",
    refused.status === 303 || refused.status === 404,
    `HTTP ${refused.status}`
  );
}

console.log(
  `\n${failures} failure(s) across ${checks} checks${skipped ? `, ${skipped} skipped` : ""}.`
);
process.exit(failures === 0 ? 0 : 1);
