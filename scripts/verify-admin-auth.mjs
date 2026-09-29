/**
 * End-to-end check of the admin auth boundary against a running dev server.
 * Verifies that anonymous access is refused and that real credentials work.
 */
import { resolveBase } from "./lib/base-url.mjs";

const BASE = resolveBase();
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.");
  process.exit(2);
}

let cookie = "";

function decode(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function hidden(html, name) {
  const re = new RegExp(
    `<input[^>]*name="${name.replace(/\$/g, "\\$")}"[^>]*value="([^"]*)"`
  );
  const m = html.match(re);
  return m ? decode(m[1]) : "";
}

function absorb(res) {
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookie) {
    const [pair] = c.split(";");
    if (pair.startsWith("gs_session=")) cookie = pair;
  }
}

async function main() {
  let failures = 0;
  /**
   * Records one assertion. The detail is only shown for a failure, so a passing
   * line stays readable; a printed detail on a PASS reads as a complaint and
   * sends the reader looking for a problem that is not there.
   */
  const check = (name, ok, detail = "") => {
    const note = !ok && detail ? `  -> ${detail}` : "";
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note}`);
    if (!ok) failures += 1;
  };

  // --- 1. anonymous access is blocked -------------------------------------
  for (const path of ["/admin", "/admin/dashboard"]) {
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    const loc = res.headers.get("location") || "";
    check(
      `anonymous ${path} redirects to login`,
      res.status === 307 && loc.startsWith("/admin/login"),
      `${res.status} ${loc}`
    );
  }

  // --- 2. anonymous API access is blocked ----------------------------------
  for (const path of ["/admin/api/search?q=oxford", "/admin/api/notifications"]) {
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    check(`anonymous ${path} is 401`, res.status === 401, String(res.status));
  }

  // --- 3. login page renders ----------------------------------------------
  const page = await fetch(`${BASE}/admin/login`);
  const html = await page.text();
  check("login page renders", page.status === 200 && html.includes("Admin sign in"));
  check(
    "login page is not indexable",
    /<meta name="robots" content="[^"]*noindex/.test(html)
  );

  // --- 4. wrong password is rejected --------------------------------------
  {
    const actionRef = hidden(html, "$ACTION_1:0");
    const fd = new FormData();
    fd.set("$ACTION_REF_1", "");
    fd.set("$ACTION_1:0", actionRef);
    fd.set("$ACTION_1:1", hidden(html, "$ACTION_1:1"));
    fd.set("$ACTION_KEY", hidden(html, "$ACTION_KEY"));
    fd.set("email", EMAIL);
    fd.set("password", "definitely-not-the-password");

    const res = await fetch(`${BASE}/admin/login`, { method: "POST", body: fd, redirect: "manual" });
    absorb(res);
    const body = await res.text();
    check(
      "wrong password is rejected with a generic error",
      body.includes("Incorrect email or password"),
      cookie ? "WARNING: a cookie was set despite failure" : ""
    );
    check("no session cookie after failed login", cookie === "");
  }

  // --- 5. correct password establishes a session --------------------------
  const freshPage = await fetch(`${BASE}/admin/login`);
  const freshHtml = await freshPage.text();
  {
    const fd = new FormData();
    fd.set("$ACTION_REF_1", "");
    fd.set("$ACTION_1:0", hidden(freshHtml, "$ACTION_1:0"));
    fd.set("$ACTION_1:1", hidden(freshHtml, "$ACTION_1:1"));
    fd.set("$ACTION_KEY", hidden(freshHtml, "$ACTION_KEY"));
    fd.set("email", EMAIL);
    fd.set("password", PASSWORD);

    const res = await fetch(`${BASE}/admin/login`, { method: "POST", body: fd, redirect: "manual" });
    absorb(res);
    check("login issues a session cookie", cookie.startsWith("gs_session=") && cookie.length > 40);
  }

  // --- 6. the session actually authorizes ---------------------------------
  {
    const res = await fetch(`${BASE}/admin/dashboard`, {
      headers: { cookie },
      redirect: "manual",
    });
    const body = await res.text();
    check("dashboard is reachable with the session", res.status === 200, String(res.status));
    check("dashboard shows real stats", body.includes("Total Scholarships"));
    check("dashboard shows the signed-in email", body.includes(EMAIL));
  }

  // --- 7. the search API works for staff ----------------------------------
  {
    const res = await fetch(`${BASE}/admin/api/search?q=oxford`, {
      headers: { cookie },
    });
    const data = await res.json();
    check("admin search returns hits for staff", res.status === 200 && data.hits.length > 0,
      `${data.hits?.length ?? 0} hits`);
  }

  // --- 8. logout revokes access -------------------------------------------
  {
    const logoutPage = await fetch(`${BASE}/admin/dashboard`, { headers: { cookie } });
    const dashHtml = await logoutPage.text();
    // The sign-out button posts the logout action.
    const m = dashHtml.match(/name="\$ACTION_ID_([a-f0-9]+)"/);
    if (m) {
      const fd = new FormData();
      fd.set(`$ACTION_ID_${m[1]}`, "");
      await fetch(`${BASE}/admin/dashboard`, {
        method: "POST",
        headers: { cookie },
        body: fd,
        redirect: "manual",
      });
    }
    const after = await fetch(`${BASE}/admin/dashboard`, {
      headers: { cookie },
      redirect: "manual",
    });
    check(
      "session no longer authorizes after logout",
      after.status === 307,
      `${after.status} ${after.headers.get("location") || ""}`
    );
  }

  console.log(failures === 0 ? "\nAll auth checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("verification crashed:", e);
  process.exit(1);
});
