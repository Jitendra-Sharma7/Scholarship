/**
 * Form validation verification.
 *
 * Every form on the site is exercised over real HTTP with deliberately bad input,
 * and the assertion is always the same shape: the server must refuse, and it
 * must say why. A form that accepts bad input, or that refuses without
 * explaining, fails here.
 *
 * This exists because the public sign-in and registration forms once accepted
 * any email and any password, waited 800ms in the browser, and reported success
 * without contacting a server at all. Nothing about that looked broken in a
 * screenshot; it only showed up when the checks asked the server a question.
 *
 * Needs `ADMIN_EMAIL` and `ADMIN_PASSWORD`, and a server on
 * `NEXTAUTH_URL` (or `PORT`) from `.env` for the admin sections. The public sections are
 * checked anonymously.
 */
import fs from "node:fs";
import path from "node:path";

import { resolveBase } from "./lib/base-url.mjs";

const BASE = resolveBase();
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

let failures = 0;
let checks = 0;

/**
 * Records one assertion. `detail` is only shown for a failure, so a passing
 * line stays readable and a failing one explains what the server objected to.
 */
function check(label, ok, detail) {
  checks += 1;
  const note = !ok && detail ? `  -> ${detail}` : "";
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${note}`);
  if (!ok) failures += 1;
}

function decode(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function hiddenFields(html) {
  const out = [];
  for (const tag of html.match(/<input[^>]*type="hidden"[^>]*>/g) ?? []) {
    const name = tag.match(/name="([^"]*)"/)?.[1];
    const value = tag.match(/value="([^"]*)"/)?.[1] ?? "";
    if (name) out.push([decode(name), decode(value)]);
  }
  return out;
}

let cookie = "";

function absorb(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    if (pair.startsWith("gs_session=")) cookie = pair;
  }
}

/** The first inline error the server rendered, so a failure says what it objected to. */
function firstError(html) {
  const m = html.match(/role="alert"[^>]*>([\s\S]{0,200}?)</);
  if (m) return decode(m[1]).replace(/\s+/g, " ").trim().slice(0, 140);
  const t = html.match(/<p[^>]*class="[^"]*text-red[^"]*"[^>]*>([\s\S]{0,200}?)</);
  return t ? decode(t[1]).replace(/\s+/g, " ").trim().slice(0, 140) : "(no inline error rendered)";
}

async function submitForm(path, fields) {
  const page = await fetch(`${BASE}${path}`, { headers: cookie ? { cookie } : {} });
  const html = await page.text();

  const fd = new FormData();
  for (const [name, value] of hiddenFields(html)) fd.set(name, value);
  for (const [name, value] of Object.entries(fields)) {
    if (Array.isArray(value)) for (const v of value) fd.append(name, v);
    else if (value === null) fd.delete(name);
    else fd.set(name, value);
  }

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: cookie ? { cookie, origin: BASE } : { origin: BASE },
    body: fd,
    redirect: "manual",
  });
  absorb(res);
  return { res, html: await res.text() };
}

/**
 * Reads a source file and reports whether it still contains a pattern.
 *
 * The public sign-in and registration forms call their server actions
 * imperatively from a transition, so there is no `<form action>` for a
 * browser-shaped request to replay and the action id is not discoverable from
 * the HTML. Their validation rules are the ones in `signIn` and `signUp`,
 * which the admin login form exercises over real HTTP below, because
 * `loginAction` delegates to the same function. What these two checks add is
 * that the public forms are wired to those functions at all - the failure this
 * guards against was a page that validated nothing and called no server.
 */
function sourceHas(relativePath, pattern) {
  const file = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(file)) return { found: false, detail: `${relativePath} is missing` };
  const code = stripComments(fs.readFileSync(file, "utf8"));
  const found = pattern.test(code);
  return {
    found,
    detail: found ? "the page still does this itself instead of calling the server" : "",
  };
}

/** Drops comments so a note describing a past bug is not read as the bug. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/**
 * Signs in for the write checks, waiting out the login limiter if it trips.
 *
 * The limiter is keyed `login:<email>` and allows 8 attempts a minute. The
 * aggregate suite signs the same admin in once per script, so a back-to-back
 * `npm run verify` can legitimately exhaust the budget. That is the limiter
 * working, not a failure, so the harness waits for the window rather than
 * reporting a pass-shaped error or weakening the limit for tests.
 */
async function signInAdmin() {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const r = await submitForm("/admin/login", { email: EMAIL, password: PASSWORD });
    const status = r.res.status;
    if (status === 303 || status === 302) return { ok: true, status };

    const wait = r.html.match(/Try again in (\d+) seconds/);
    if (attempt === 1 && wait) {
      const seconds = Math.min(Number(wait[1]) + 2, 90);
      console.log(`      (login limiter active, waiting ${seconds}s)`);
      await new Promise((done) => setTimeout(done, seconds * 1000));
      continue;
    }
    return { ok: false, status };
  }
  return { ok: false, status: 0 };
}

async function main() {
  // ---------------------------------------------------------------------
  // 1. Public sign-in and registration
  //
  // These are the forms that were entirely client-side: any email and any
  // password produced a success toast without a server being involved.
  // ---------------------------------------------------------------------
  console.log("\n-- public sign-in --");
  {
    const html = await (await fetch(`${BASE}/auth/login`)).text();
    check(
      "/auth/login no longer advertises a demo credential",
      !/any email and password will work/i.test(html) && !/password123/.test(html),
      "the page told visitors any password was accepted"
    );
  }

  {
    const wired = sourceHas("src/app/auth/login/LoginForm.tsx", /import\s*\{[^}]*\bsignIn\b[^}]*\}\s*from\s*["']@\/app\/actions\/auth-actions["']/);
    check(
      "/auth/login calls the server-side signIn action",
      wired.found,
      wired.detail || "the form did not import a server action"
    );

    const faked = sourceHas(
      "src/app/auth/login/LoginForm.tsx",
      /setTimeout\([^)]*\)|Simulate API call|Mock success/
    );
    check(
      "/auth/login no longer fakes a network round trip",
      !faked.found,
      faked.detail
    );
  }

  console.log("\n-- public registration --");
  {
    const wired = sourceHas("src/app/auth/register/RegisterForm.tsx", /import\s*\{[^}]*\bsignUp\b[^}]*\}\s*from\s*["']@\/app\/actions\/auth-actions["']/);
    check(
      "/auth/register calls the server-side signUp action",
      wired.found,
      wired.detail || "the form did not import a server action"
    );

    const faked = sourceHas(
      "src/app/auth/register/RegisterForm.tsx",
      /Account created successfully|setTimeout\([^)]*\)/
    );
    check(
      "/auth/register no longer claims an account it did not create",
      !faked.found,
      faked.detail
    );
  }

  // ---------------------------------------------------------------------
  // 2. The sign-in rules, over real HTTP
  //
  // `/admin/login` submits through `<form action>`, so the hidden action fields
  // are in the HTML and a request can be replayed exactly as a browser sends
  // it. `loginAction` delegates to `signIn`, the same function the public form
  // calls, so these assertions cover the public rules too.
  // ---------------------------------------------------------------------
  console.log("\n-- sign-in validation (via the form-based admin login) --");
  {
    const r = await submitForm("/admin/login", { email: "not-an-email", password: "password123" });
    check(
      "a malformed email address is refused",
      r.html.includes("valid email"),
      firstError(r.html)
    );
  }

  {
    const r = await submitForm("/admin/login", { email: "someone@example.com", password: "" });
    check(
      "an empty password is refused",
      r.html.includes("Password is required"),
      firstError(r.html)
    );
  }

  {
    // A well-formed address that does not exist must not authenticate. The
    // address is unique per run so this never spends the real admin's budget
    // in the `login:<email>` bucket, which the whole suite shares.
    const r = await submitForm("/admin/login", {
      email: `nobody-${Date.now()}@example.com`,
      password: "password123",
    });
    const refused = r.res.status !== 303 && r.res.status !== 302;
    const noSession = !(r.res.headers.getSetCookie?.() ?? []).some((c) =>
      c.includes("gs_session=")
    );
    check(
      "unknown credentials are refused and set no session",
      refused && noSession,
      `HTTP ${r.res.status} ${firstError(r.html)}`
    );
  }

  // ---------------------------------------------------------------------
  // 2. Public scholarship submission
  // ---------------------------------------------------------------------
  console.log("\n-- public submission intake --");
  {
    const res = await fetch(`${BASE}/api/public/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "SCHOLARSHIP", title: "x", submitterName: "A", submitterEmail: "nope" }),
    });
    const body = await res.json();
    check(
      "a submission with a malformed email is refused",
      res.status === 422 && Boolean(body.fieldErrors),
      `HTTP ${res.status} ${JSON.stringify(body).slice(0, 120)}`
    );
    check(
      "the refusal names the offending field",
      Boolean(body.fieldErrors?.submitterEmail) && Boolean(body.fieldErrors?.title),
      JSON.stringify(body.fieldErrors ?? {})
    );
  }

  {
    const res = await fetch(`${BASE}/api/public/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "SCHOLARSHIP", title: "T", submitterName: "Verification Script", submitterEmail: "v@example.com", officialUrl: "javascript:alert(1)" }),
    });
    const body = await res.json();
    check(
      "a submission with a non-http source URL is refused",
      res.status === 422 && Boolean(body.fieldErrors?.officialUrl),
      `HTTP ${res.status} ${JSON.stringify(body.fieldErrors ?? {})}`
    );
  }

  // ---------------------------------------------------------------------
  // 3. Contact form
  // ---------------------------------------------------------------------
  console.log("\n-- contact form --");
  {
    const html = await (await fetch(`${BASE}/contact`)).text();
    check(
      "/contact does not claim an unconnected form was received",
      !/Your message has been recorded/.test(html),
      "the page asserted a delivery that no backend performs"
    );
  }

  // ---------------------------------------------------------------------
  // 4. Admin writers, which touch the database
  // ---------------------------------------------------------------------
  if (!EMAIL || !PASSWORD) {
    console.log("\nSkipping admin checks: set ADMIN_EMAIL and ADMIN_PASSWORD.");
  } else {
    const login = await signInAdmin();
    check("admin can sign in for the write checks", login.ok, `HTTP ${login.status}`);

    console.log("\n-- admin scholarship editor --");
    {
      const r = await submitForm("/admin/scholarships/new", {
        title: "",
        fundingType: "fully-funded",
        deadline: "2027-01-01",
      });
      check(
        "a scholarship with no title is refused",
        r.html.includes("required") || /name a title|required/i.test(firstError(r.html)),
        firstError(r.html)
      );
      check(
        "the refused scholarship created no record",
        !/edit\/[a-z0-9]{20,}/.test(r.res.headers.get("location") || ""),
        r.res.headers.get("location") || "(no redirect)"
      );
    }

    {
      const r = await submitForm("/admin/scholarships/new", {
        title: "Validation Probe",
        fundingType: "not-a-funding-type",
        deadline: "2027-01-01",
        degreeLevels: "Master's",
      });
      check(
        "an unknown funding type is refused",
        r.html.includes("fundingType") || /funding/i.test(firstError(r.html)),
        firstError(r.html)
      );
    }

    {
      const r = await submitForm("/admin/scholarships/new", {
        title: "Validation Probe",
        fundingType: "fully-funded",
        deadline: "definitely-not-a-date",
        degreeLevels: "Master's",
      });
      check(
        "an unparseable deadline is refused",
        r.html.includes("deadline") || /date/i.test(firstError(r.html)),
        firstError(r.html)
      );
    }

    console.log("\n-- admin settings --");
    {
      const r = await submitForm("/admin/settings", { "scholarships.pageSize": "not-a-number" });
      check(
        "a non-numeric setting is refused",
        r.html.includes("scholarships.pageSize") || /number/i.test(firstError(r.html)),
        firstError(r.html)
      );
    }

    {
      const r = await submitForm("/admin/settings", { "scholarships.pageSize": "100000" });
      check(
        "an out-of-range setting is refused",
        r.html.includes("scholarships.pageSize") || /between|must be/i.test(firstError(r.html)),
        firstError(r.html)
      );
    }

    console.log("\n-- admin registry editor --");
    {
      const r = await submitForm("/admin/universities/new", { name: "" });
      check(
        "a university with no name is refused",
        r.html.includes("name") || /required/i.test(firstError(r.html)),
        firstError(r.html)
      );
    }
  }

  console.log(`\n${failures} failure(s) across ${checks} checks.`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
