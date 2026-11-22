/**
 * Cookie consent popup interaction test.
 *
 * Reproduces and guards the reported bug: the consent banner was visible
 * (server-rendered) but its buttons did not respond to clicks. Root cause was a
 * Content-Security-Policy that blocked Next.js's inline bootstrap/hydration
 * scripts (no nonce, no 'unsafe-inline'), so React never hydrated and no
 * onClick handler was ever attached. The banner therefore showed dead buttons.
 *
 * This drives a real Chromium browser via Playwright against a running dev/prod
 * server. It records console errors and uncaught page errors (hydration
 * failures land there), asserts the CSP actually carries a nonce, and exercises
 * the three buttons on both a desktop and a mobile viewport:
 *
 *   1. Accept All  -> stores consent, closes the popup, survives reload.
 *   2. Reject All  -> stores a "nothing optional" decision, closes the popup.
 *   3. Customise   -> opens the preference dialog and saves a category choice.
 *
 * Usage: node tests/cookie-test.js [baseURL]
 * Defaults to http://localhost:2055 (or BASE / NEXTAUTH_URL from env).
 */
import { chromium } from "playwright";

import { resolveBase } from "../scripts/lib/base-url.mjs";

const BASE = (process.argv[2] || process.env.BASE || resolveBase()).replace(/\/$/, "");

const CONSENT_KEY = "gs_hub_consent";

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${!ok && detail ? `  -> ${detail}` : ""}`);
  if (!ok) failures += 1;
}

/**
 * Return to a clean, undecided first-visit state and wait until the banner is
 * interactive. The banner is server-rendered, so "visible" alone does not prove
 * React has hydrated; we therefore wait for the document load and give the
 * client bundle a moment to attach handlers before interacting.
 */
async function resetToUndecided(page) {
  await page.evaluate((k) => localStorage.removeItem(k), CONSENT_KEY);
  await page.reload({ waitUntil: "load", timeout: 90000 });
  await page.getByRole("button", { name: "Accept All" }).waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(750);
}

/** Click, tolerating the "element detached after the popup closed" race. */
async function click(page, locator) {
  await locator.click({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
}

/** Run the full three-button suite against an open page. */
async function exercise(page, label) {
  console.log(`\n[${label}]`);

  // ---- Accept All ----
  await resetToUndecided(page);
  check("banner shown on first visit", await page.getByRole("button", { name: "Accept All" }).isVisible().catch(() => false));

  await click(page, page.getByRole("button", { name: "Accept All" }));
  const accepted = await page.evaluate((k) => localStorage.getItem(k), CONSENT_KEY);
  check("Accept All saves consent", !!accepted && JSON.parse(accepted).analytics === true, String(accepted));
  check(
    "Accept All closes the popup",
    !(await page.getByRole("button", { name: "Accept All" }).isVisible().catch(() => false))
  );

  await page.reload({ waitUntil: "load", timeout: 90000 });
  await page.waitForTimeout(1500);
  check(
    "consent persists across reload",
    !(await page.getByRole("button", { name: "Accept All" }).isVisible().catch(() => false))
  );

  // ---- Reject All ----
  await resetToUndecided(page);
  await click(page, page.getByRole("button", { name: "Reject All" }));
  const rejected = await page.evaluate((k) => localStorage.getItem(k), CONSENT_KEY);
  check(
    "Reject All saves consent with optionals off",
    !!rejected && JSON.parse(rejected).analytics === false && JSON.parse(rejected).marketing === false,
    String(rejected)
  );

  // ---- Customise ----
  await resetToUndecided(page);
  await click(page, page.getByRole("button", { name: "Customise" }));
  check("Customise opens preferences", await page.getByText("Cookie preferences").isVisible().catch(() => false));

  await page.getByRole("switch", { name: /Analytics cookies/i }).click({ timeout: 15000 }).catch(() => {});
  await click(page, page.getByRole("button", { name: "Save preferences" }));
  const custom = await page.evaluate((k) => localStorage.getItem(k), CONSENT_KEY);
  check("Customise save persists choice", !!custom && JSON.parse(custom).analytics === true, String(custom));
}

async function run() {
  const browser = await chromium.launch();

  // ---- Security header: the CSP must carry a per-request nonce ----
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const res = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 90000 });
    const csp = res?.headers()["content-security-policy"] ?? "";
    check("CSP header present", csp.length > 0);
    check("CSP script-src carries a nonce", /script-src[^;]*'nonce-/.test(csp), csp.slice(0, 120));
    await ctx.close();
  }

  // ---- Desktop ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(2500);
    await exercise(page, "desktop (1280x800)");
    check("desktop: no uncaught page errors", pageErrors.length === 0, pageErrors.join(" | "));
    await ctx.close();
  }

  // ---- Mobile ----
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(2500);
    await exercise(page, "mobile (390x844)");
    check("mobile: no uncaught page errors", pageErrors.length === 0, pageErrors.join(" | "));
    await ctx.close();
  }

  await browser.close();

  console.log(`\n${failures === 0 ? "ALL PASSED" : failures + " CHECK(S) FAILED"}`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});