import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:2055";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
});
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? " - " + detail : ""}`);
}

// 1. Load home page and verify the banner is visible.
await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(3000);

const banner = page.getByRole("dialog", { name: /value your privacy/i });
check("Cookie banner visible on first visit", await banner.isVisible());

// 2. Click Accept All and verify the banner closes.
const acceptBtn = page.getByRole("button", { name: "Accept All" });
check("Accept All button is visible", await acceptBtn.isVisible());
await acceptBtn.click();
await page.waitForTimeout(500);
check("Banner closed after Accept All", !(await banner.isVisible().catch(() => false)));

// 3. Reload and verify banner stays closed (consent persisted).
await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(2000);
check("Banner stays closed after reload (consent saved)", !(await banner.isVisible().catch(() => false)));

// 4. Verify localStorage has consent saved.
const stored = await page.evaluate(() => localStorage.getItem("gs_hub_consent"));
check("Consent saved to localStorage", !!stored && stored.includes("functional"), stored || "null");

// 5. Go to /cookies and click "Manage cookie preferences".
await page.goto(`${BASE}/cookies`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(1500);
const manageBtn = page.getByRole("button", { name: /Manage cookie preferences/i });
check("Manage cookie preferences button visible", await manageBtn.isVisible());
await manageBtn.click();
await page.waitForTimeout(500);

// 6. Verify preferences dialog opens.
const prefDialog = page.getByRole("heading", { name: /Cookie preferences/i });
check("Preferences dialog opens after Manage click", await prefDialog.isVisible());

// 7. Toggle a switch.
const analyticsSwitch = page.getByRole("switch", { name: /Analytics cookies/i });
check("Analytics switch visible", await analyticsSwitch.isVisible());
const before = await analyticsSwitch.getAttribute("aria-checked");
await analyticsSwitch.click();
await page.waitForTimeout(200);
const after = await analyticsSwitch.getAttribute("aria-checked");
check("Analytics switch toggles", before !== after, `${before} -> ${after}`);

// 8. Save preferences.
const saveBtn = page.getByRole("button", { name: /Save preferences/i });
check("Save preferences button visible", await saveBtn.isVisible());
await saveBtn.click();
await page.waitForTimeout(500);

const prefDialogAfter = page.getByRole("heading", { name: /Cookie preferences/i });
check("Preferences dialog closes after Save", !(await prefDialogAfter.isVisible().catch(() => false)));

// 9. Verify saved analytics value is true.
const stored2 = await page.evaluate(() => localStorage.getItem("gs_hub_consent"));
const parsed = JSON.parse(stored2 || "{}");
check("Saved analytics = true", parsed.analytics === true, JSON.stringify(parsed));

// 10. Test Reject All from preferences.
await page.goto(`${BASE}/cookies`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(1000);
await page.getByRole("button", { name: /Manage cookie preferences/i }).click();
await page.waitForTimeout(300);
const rejectBtn = page.getByRole("button", { name: "Reject All" });
await rejectBtn.click();
await page.waitForTimeout(300);
const stored3 = await page.evaluate(() => localStorage.getItem("gs_hub_consent"));
const parsed3 = JSON.parse(stored3 || "{}");
check("Reject All sets all to false", parsed3.functional === false && parsed3.analytics === false && parsed3.marketing === false, JSON.stringify(parsed3));

// 11. Test Clear choice.
await page.goto(`${BASE}/cookies`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(1000);
await page.getByRole("button", { name: /Manage cookie preferences/i }).click();
await page.waitForTimeout(300);
const clearBtn = page.getByRole("button", { name: /Clear choice/i });
await clearBtn.click();
await page.waitForTimeout(300);
const stored4 = await page.evaluate(() => localStorage.getItem("gs_hub_consent"));
check("Clear choice removes consent from localStorage", stored4 === null, stored4 || "null");

// 12. Test Customise from banner.
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(2500);
const customiseBtn = page.getByRole("button", { name: "Customise" });
check("Customise button visible on banner", await customiseBtn.isVisible());
await customiseBtn.click();
await page.waitForTimeout(300);
check("Preferences opens after Customise", await page.getByRole("heading", { name: /Cookie preferences/i }).isVisible());

// 13. Close preferences with X button.
const closeBtn = page.getByRole("button", { name: /Close preferences/i });
await closeBtn.click();
await page.waitForTimeout(300);

// 14. Verify other site buttons still work (e.g., header nav dropdown).
const scholarshipsBtn = page.getByRole("button", { name: /^Scholarships$/i });
if (await scholarshipsBtn.isVisible()) {
  await scholarshipsBtn.click();
  await page.waitForTimeout(300);
  const dropdown = page.locator("#nav-dropdown-scholarships");
  check("Header nav dropdown opens", await dropdown.isVisible());
}

console.log("\n--- Console / Page errors ---");
if (errors.length === 0) {
  console.log("No console errors or page errors captured.");
} else {
  for (const e of errors) console.log(e);
}

console.log("\n--- Summary ---");
const passed = results.filter((r) => r.ok).length;
console.log(`${passed}/${results.length} checks passed.`);

await browser.close();
process.exit(passed === results.length ? 0 : 1);