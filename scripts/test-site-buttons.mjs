import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:2055";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? " - " + detail : ""}`);
}

async function go(path, wait = 1500) {
  const t = Date.now();
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(wait);
  return Date.now() - t;
}

// Pre-set consent so the banner doesn't block buttons.
await page.goto(`${BASE}/cookies`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(800);
await page.evaluate(() => {
  localStorage.setItem("gs_hub_consent", JSON.stringify({
    essential: true, functional: true, analytics: false, marketing: false,
    decidedAt: new Date().toISOString(), version: 1,
  }));
});

// --- Home page ---
let ms = await go("/", 2000);
check("Home page loads in <10s", ms < 10000, `${ms}ms`);

// Home search button visible & clickable
const homeForm = page.locator('form').filter({ has: page.locator('input[placeholder*="Search scholarships"]') }).first();
const homeSubmit = homeForm.locator('button[type="submit"]');
check("Home search submit button visible", await homeSubmit.isVisible());

// Header dropdown
const scholarshipNav = page.getByRole("button", { name: /^Scholarships$/i });
if (await scholarshipNav.isVisible().catch(() => false)) {
  await scholarshipNav.click();
  await page.waitForTimeout(200);
  check("Header 'Scholarships' dropdown opens", await page.locator("#nav-dropdown-scholarships").isVisible());
}

// --- Cookie buttons ---
await go("/cookies", 800);
await page.getByRole("button", { name: /Manage cookie preferences/i }).click();
await page.waitForTimeout(300);
check("Manage cookie prefs opens dialog", await page.getByRole("heading", { name: /Cookie preferences/i }).isVisible());
const saveBtn = page.getByRole("button", { name: /Save preferences/i });
check("Save preferences button visible", await saveBtn.isVisible());
await page.getByRole("button", { name: /Clear choice/i }).click();
await page.waitForTimeout(300);
// Clear choice now dismisses the dialog entirely.
check("Clear choice dismisses dialog", !(await page.getByRole("heading", { name: /Cookie preferences/i }).isVisible().catch(() => false)));
const stored4 = await page.evaluate(() => localStorage.getItem("gs_hub_consent"));
check("Clear choice removes consent from localStorage", stored4 === null, stored4 || "null");

// Re-set consent so subsequent page loads don't show the banner.
await page.evaluate(() => {
  localStorage.setItem("gs_hub_consent", JSON.stringify({
    essential: true, functional: true, analytics: false, marketing: false,
    decidedAt: new Date().toISOString(), version: 1,
  }));
});

// --- Scholarships page ---
ms = await go("/scholarships", 2500);
check("/scholarships loads in <10s", ms < 10000, `${ms}ms`);
const searchInput = page.locator("#scholarship-search");
check("/scholarships search input visible", await searchInput.isVisible());
const schSubmit = page.locator('button[type="submit"]').filter({ hasText: "Search" }).first();
check("/scholarships search submit visible", await schSubmit.isVisible());

// Grid/list view toggle
const gridBtn = page.getByRole("button", { name: "Grid view" });
const listBtn = page.getByRole("button", { name: "List view" });
if (await gridBtn.isVisible().catch(() => false)) {
  await listBtn.click();
  await page.waitForTimeout(300);
  check("View toggle switches to list", (await page.locator('[aria-label="List view"]').getAttribute("class"))?.includes("bg-primary-600") ?? false);
  await gridBtn.click();
}

// Save button on a card (label changes to "Remove from saved" after click, so
// target by the card's stable structure rather than the changing label).
const saveBtns = page.locator('button[aria-label*="Save scholarship"], button[aria-label*="Remove from saved"]');
const saveCount = await saveBtns.count();
check("Scholarship cards have save buttons", saveCount > 0, `${saveCount} found`);
if (saveCount > 0) {
  const first = saveBtns.first();
  const before = await first.getAttribute("aria-label");
  await first.click();
  await page.waitForTimeout(300);
  const after = await first.getAttribute("aria-label");
  check("Save button toggles label", before !== after, `${before} -> ${after}`);
  await first.click(); // toggle back
  await page.waitForTimeout(200);
}

// Compare button
const compareBtns = page.locator('button[aria-label*="Compare" i]');
check("Compare buttons present", (await compareBtns.count()) > 0, `${await compareBtns.count()} found`);

// Pagination
const nextPage = page.getByRole("button", { name: "Next page" });
if (await nextPage.isVisible().catch(() => false)) {
  const before = await page.locator('[aria-current="page"]').first().textContent();
  await nextPage.click();
  await page.waitForTimeout(1500);
  const after = await page.locator('[aria-current="page"]').first().textContent();
  check("Pagination Next changes page", before !== after, `${before} -> ${after}`);
}

// --- Universities page ---
ms = await go("/universities", 4000);
check("/universities loads in <10s", ms < 10000, `${ms}ms`);
const uniSaveBtns = page.locator('button[aria-label*="Save university" i]');
check("University save buttons present", (await uniSaveBtns.count()) > 0, `${await uniSaveBtns.count()} found`);
const uniNext = page.getByRole("button", { name: "Next page" });
check("University Next page button present", await uniNext.count() > 0);

// --- Deadlines page ---
ms = await go("/deadlines", 2000);
check("/deadlines loads in <10s", ms < 10000, `${ms}ms`);
// The "Notify Me" signup lives on the homepage's DeadlineAlerts section.
const deadlineTabs = page.locator('button').filter({ hasText: /list|calendar|all|closing|upcoming/i });
check("/deadlines view/filter buttons present", (await deadlineTabs.count()) > 0, `${await deadlineTabs.count()} found`);

// --- Compare page ---
ms = await go("/compare", 1500);
check("/compare loads in <10s", ms < 10000, `${ms}ms`);

console.log("\n--- Summary ---");
const passed = results.filter((r) => r.ok).length;
console.log(`${passed}/${results.length} checks passed.`);
for (const r of results.filter((r) => !r.ok)) console.log(`  FAILED: ${r.name} ${r.detail}`);

await browser.close();
process.exit(passed === results.length ? 0 : 1);