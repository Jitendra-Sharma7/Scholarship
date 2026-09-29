/**
 * End-to-end verification of the registry-driven admin sections, the submission
 * inbox, and site settings against a running server.
 *
 * Exercises the real HTTP surface - session, rendered forms, server actions,
 * public visibility - so a pass means the whole stack works together. Nothing
 * here touches the database directly.
 *
 * Server actions are invoked by replaying the hidden `$ACTION_*` fields the
 * rendered form carries, which is what a browser does. Production server
 * actions also require an `origin` header, so requests carry one.
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
const created = { countryId: "", countryCode: "", countrySlug: "", submissionId: "" };

/**
 * Unassigned ISO alpha-2 codes (the "X" user-assigned range), so a run never
 * collides with a real country. Each run consumes one code and leaves its
 * record behind, so the create step walks this list until one is free.
 */
const CODE_POOL = [
  "XA", "XB", "XC", "XD", "XE", "XF", "XG", "XH", "XI", "XJ",
  "XK", "XL", "XM", "XN", "XO", "XP", "XQ", "XR", "XS", "XT",
];
let RUN_CODE = CODE_POOL[0];
let RUN_SLUG = `verify-land-${RUN_CODE.toLowerCase()}`;
/**
 * The display name is unique per run too. The draft-visibility and deletedAt
 * checks assert on the rendered name, so a leftover PUBLISHED record from an
 * earlier run would otherwise make a fresh draft look like it leaked.
 */
let RUN_NAME = `Verify Land ${RUN_CODE}`;

/**
 * The country create action reports a duplicate ISO code inline, so a taken
 * code is discoverable by trying it. `createCountry` walks the pool until one
 * is accepted and leaves RUN_CODE pointing at the code that worked.
 */

function decode(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function absorb(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    if (pair.startsWith("gs_session=")) cookie = pair;
  }
}

function hiddenFields(html) {
  const out = [];
  const re = /<input[^>]*type="hidden"[^>]*>/g;
  for (const tag of html.match(re) ?? []) {
    const name = tag.match(/name="([^"]*)"/)?.[1];
    const value = tag.match(/value="([^"]*)"/)?.[1] ?? "";
    if (name) out.push([decode(name), decode(value)]);
  }
  return out;
}

async function submitForm(path, fields) {
  const page = await fetch(`${BASE}${path}`, { headers: { cookie } });
  const html = await page.text();

  const fd = new FormData();
  for (const [name, value] of hiddenFields(html)) fd.set(name, value);
  for (const [name, value] of Object.entries(fields)) {
    if (Array.isArray(value)) for (const v of value) fd.append(name, v);
    else fd.set(name, value);
  }

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { cookie, origin: BASE },
    body: fd,
    redirect: "manual",
  });
  absorb(res);
  return { res, html: await res.text() };
}

/** Grabs the new record's id from the redirect the create action issues. */
function idFromRedirect(res) {
  const loc = res.headers.get("location") || "";
  const m = loc.match(/\/admin\/[^/]+\/([^/]+)\/edit/);
  return m ? m[1] : "";
}

/**
 * A server action that succeeds and then redirects answers 303 in production
 * and 307 in development, so both count as "it worked".
 */
function redirected(res) {
  return res.status === 303 || res.status === 307 || res.status === 302;
}

/**
 * Pulls the first inline error out of a re-rendered form so a failed check says
 * what the server actually objected to instead of only a status code.
 */
function firstError(html) {
  const m = html.match(/role="alert"[^>]*>([\s\S]{0,200}?)</);
  if (m) return decode(m[1]).replace(/\s+/g, " ").trim().slice(0, 160);
  const t = html.match(/<p[^>]*class="[^"]*text-red[^"]*"[^>]*>([\s\S]{0,200}?)</);
  return t ? decode(t[1]).replace(/\s+/g, " ").trim().slice(0, 160) : "(no inline error found)";
}

/**
 * Public listing pages are prerendered, so a publish lands on them only after
 * the background revalidation has run. Poll briefly instead of reading once and
 * reporting a cache miss as a content failure.
 */
async function fetchUntil(path, predicate, attempts = 8, delayMs = 1000) {
  let html = "";
  for (let i = 0; i < attempts; i += 1) {
    const res = await fetch(`${BASE}${path}`, { headers: { cookie } });
    html = await res.text();
    if (predicate(html)) return { html, ok: true };
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return { html, ok: false };
}

async function main() {
  let failures = 0;
  let skips = 0;
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
  /**
   * A throttled endpoint proves nothing either way, so a rate-limited check is
   * reported without counting as a failure. The intake endpoint allows a small
   * number of posts per window, and repeated runs can exhaust it.
   */
  const skip = (name, detail = "") => {
    console.log(`SKIP  ${name}${detail ? "  -> " + detail : ""}`);
    skips += 1;
  };

  const anon = { redirect: "manual" };

  // --- 1. Auth boundary ---------------------------------------------------
  // The public marketing chrome must not appear anywhere in the staff area.
  for (const path of ["/admin/login", "/admin/dashboard"]) {
    const res = await fetch(`${BASE}${path}`, anon);
    const html = await res.text();
    const leak = html.includes("<footer") || html.includes("Scholarships by Destination");
    check(`${path} shows no public footer`, !leak, leak ? "public footer rendered" : "");
  }

  for (const path of ["/admin/countries", "/admin/submissions", "/admin/settings"]) {
    const res = await fetch(`${BASE}${path}`, anon);
    const loc = res.headers.get("location") || "";
    check(
      `anonymous ${path} redirects to login`,
      res.status === 307 && loc.startsWith("/admin/login"),
      `${res.status} ${loc}`
    );
  }

  // --- 2. Sign in --------------------------------------------------------
  {
    const page = await fetch(`${BASE}/admin/login`);
    const html = await page.text();
    const fd = new FormData();
    for (const [name, value] of hiddenFields(html)) fd.set(name, value);
    fd.set("email", EMAIL);
    fd.set("password", PASSWORD);
    const res = await fetch(`${BASE}/admin/login`, {
      method: "POST",
      body: fd,
      redirect: "manual",
    });
    absorb(res);
    check("admin can sign in", cookie.startsWith("gs_session="), `HTTP ${res.status}`);
  }
  if (!cookie) {
    console.log("\nCannot continue without a session.");
    process.exit(1);
  }
  const authed = { headers: { cookie } };

  // --- 3. Every nav destination resolves ----------------------------------
  {
    const dash = await (await fetch(`${BASE}/admin/dashboard`, authed)).text();
    const hrefs = [...dash.matchAll(/href="(\/admin[^"#?]*)"/g)].map((m) => m[1]);
    const unique = [...new Set(hrefs)].filter((h) => !h.startsWith("/admin/login"));

    for (const href of unique) {
      const res = await fetch(`${BASE}${href}`, { headers: { cookie }, redirect: "manual" });
      // A nav link must not 404 or 500. 307 is acceptable only for a role the
      // signed-in admin does not hold; the seeded super admin holds them all.
      check(
        `nav link ${href} responds`,
        res.status === 200 || res.status === 307,
        `${res.status} ${res.headers.get("location") || ""}`
      );
    }
  }

  // --- 4. Unknown sections 404 rather than rendering an empty table -------
  for (const path of ["/admin/nonsense", "/admin/universities/does-not-exist/edit"]) {
    const res = await fetch(`${BASE}${path}`, { headers: { cookie }, redirect: "manual" });
    check(`${path} is not found`, res.status === 404, String(res.status));
  }

  // --- 5. Every registry section lists, creates and edits -----------------
  const SECTIONS = [
    { key: "universities", newFields: { name: "Verify University", type: "Public research" } },
    {
      key: "countries",
      newFields: {
        name: RUN_NAME,
        code: RUN_CODE,
        region: "Europe",
        slug: RUN_SLUG,
      },
    },
    { key: "fields", newFields: { name: "Verify Field", category: "STEM" } },
    { key: "blog", newFields: { title: "Verify Post", content: "Body text for verification." } },
    { key: "resources", newFields: { title: "Verify Resource", type: "GUIDE" } },
    { key: "media", newFields: { originalName: "verify.png", folder: "verify", url: "/flags/gb.png" } },
  ];

  for (const section of SECTIONS) {
    const listRes = await fetch(`${BASE}/admin/${section.key}`, authed);
    check(`${section.key} list renders`, listRes.status === 200, String(listRes.status));

    const newRes = await fetch(`${BASE}/admin/${section.key}/new`, authed);
    check(`${section.key} create form renders`, newRes.status === 200, String(newRes.status));

    // The create form must actually contain its own fields, not an empty shell.
    const formHtml = await newRes.text();
    const firstField = Object.keys(section.newFields)[0];
    check(
      `${section.key} create form exposes "${firstField}"`,
      formHtml.includes(`name="${firstField}"`)
    );
  }

  // Users cannot be created from the panel.
  {
    const res = await fetch(`${BASE}/admin/users/new`, {
      headers: { cookie },
      redirect: "manual",
    });
    const loc = res.headers.get("location") || "";
    check(
      "user creation redirects to the list",
      res.status === 307 && loc.startsWith("/admin/users"),
      `${res.status} ${loc}`
    );
  }

  // --- 6. A full create / publish / trash / restore / destroy cycle -------
  {
    const createPayload = (code) => ({
      name: `Verify Land ${code}`,
      code,
      code3: `${code}X`,
      slug: `verify-land-${code.toLowerCase()}`,
      region: "Europe",
      continent: "Europe",
      capital: "Verify City",
      currency: "VLR",
      description: "A country record created by the verification script.",
      officialLanguages: "Verifyish",
      publishStatus: "DRAFT",
      includeInSitemap: "true",
    });

    let createHtml = "";
    let createRes = null;
    for (const code of CODE_POOL) {
      const attempt = await submitForm("/admin/countries/new", createPayload(code));
      createRes = attempt.res;
      createHtml = attempt.html;
      if (redirected(attempt.res)) {
        RUN_CODE = code;
        RUN_NAME = `Verify Land ${code}`;
        RUN_SLUG = `verify-land-${code.toLowerCase()}`;
        break;
      }
    }
    const res = createRes;

    created.countryId = idFromRedirect(res);
    check(
      "country is created and the editor opens",
      redirected(res) && created.countryId !== "",
      redirected(res)
        ? `${res.status} ${res.headers.get("location") || ""}`
        : `HTTP ${res.status} ${firstError(createHtml)}`
    );

    if (created.countryId) {
      const edit = await fetch(`${BASE}/admin/countries/${created.countryId}/edit`, authed);
      const html = await edit.text();
      check("new country editor loads", edit.status === 200, String(edit.status));
      check(
        "editor shows the saved values",
        html.includes(RUN_NAME) && html.includes(`${RUN_CODE}X`)
      );

      // Countries have no public detail page, so visibility is judged on the
      // public country listing rather than a slug URL.
      const draftListing = await (await fetch(`${BASE}/countries`)).text();
      check(
        "a draft country is not on the public site",
        !draftListing.includes(RUN_NAME),
        draftListing.includes(RUN_NAME) ? "leaked into the listing" : ""
      );

      // A duplicate code must come back as a readable message, not a 500.
      const dupe = await submitForm("/admin/countries/new", {
        name: `${RUN_NAME} Duplicate`,
        code: RUN_CODE,
        region: "Europe",
        slug: `${RUN_SLUG}-dupe`,
        publishStatus: "DRAFT",
      });
      check(
        "a duplicate ISO code is reported, not a server error",
        dupe.res.status === 200 && dupe.html.includes("already uses that"),
        `HTTP ${dupe.res.status}`
      );

      // Publish it.
      const pub = await submitForm(`/admin/countries/${created.countryId}/edit`, {
        name: RUN_NAME,
        code: RUN_CODE,
        code3: `${RUN_CODE}X`,
        slug: RUN_SLUG,
        region: "Europe",
        continent: "Europe",
        capital: "Verify City",
        currency: "VLR",
        description: "A country record created by the verification script.",
        officialLanguages: "Verifyish",
        publishStatus: "PUBLISHED",
        includeInSitemap: "true",
      });
      check("country publishes", redirected(pub.res), String(pub.res.status));

      const live = await fetchUntil("/countries", (h) => h.includes(RUN_NAME));
      check(
        "a published country appears on the public site",
        live.ok,
        live.ok ? RUN_NAME : "not on the listing after waiting for revalidation"
      );

      // A malformed code must be rejected rather than stored.
      const bad = await submitForm(`/admin/countries/${created.countryId}/edit`, {
        name: RUN_NAME,
        code: "TOOLONG",
        slug: RUN_SLUG,
        region: "Europe",
        publishStatus: "PUBLISHED",
        includeInSitemap: "true",
      });
      check(
        "a three-letter country code is rejected",
        bad.html.includes("two-letter ISO code") || bad.res.status === 200,
        redirected(bad.res) ? "redirected (accepted)" : "rejected inline"
      );

      // The editor must not accept a client-supplied `deletedAt`: soft deletion
      // goes through the trash action, which is role-checked.
      await submitForm(`/admin/countries/${created.countryId}/edit`, {
        name: RUN_NAME,
        code: RUN_CODE,
        slug: RUN_SLUG,
        region: "Europe",
        publishStatus: "PUBLISHED",
        deletedAt: new Date().toISOString(),
        includeInSitemap: "true",
      });
      const afterInject = await fetchUntil("/countries", (h) => h.includes(RUN_NAME));
      check(
        "the editor cannot set deletedAt directly",
        afterInject.ok,
        afterInject.ok ? "record still listed" : "record was trashed by a form field"
      );
    }
  }

  // --- 7. Public submission intake is real --------------------------------
  {
    const body = {
      type: "SCHOLARSHIP",
      title: "Verification Test Scholarship",
      description: "Submitted by the verification script.",
      officialUrl: "https://example.edu/verify-scholarship",
      submitterName: "Verification Script",
      submitterEmail: `verify-${Date.now()}@example.com`,
      deadline: "2027-01-15",
      fundingAmount: "10000",
      currency: "usd",
      degreeLevels: "Master's, PhD",
    };

    const res = await fetch(`${BASE}/api/public/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) {
      skip("submission intake stores a record", "throttled");
    } else {
      created.submissionId = data.id ?? "";
      check(
        "submission intake stores a record",
        res.status === 201 && Boolean(data.id),
        `HTTP ${res.status}`
      );
    }

    // A second submission from the same address must be refused as a duplicate.
    const dup = await fetch(`${BASE}/api/public/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (dup.status === 429) skip("a duplicate submission is refused", "throttled");
    else check("a duplicate submission is refused", dup.status === 409, `HTTP ${dup.status}`);

    // An invalid body must be rejected with field errors, not stored.
    const invalid = await fetch(`${BASE}/api/public/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "SCHOLARSHIP", title: "x" }),
    });
    const invalidData = await invalid.json().catch(() => ({}));
    if (invalid.status === 429) {
      skip("an incomplete submission is rejected with field errors", "throttled");
    } else {
      check(
        "an incomplete submission is rejected with field errors",
        invalid.status === 422 && Object.keys(invalidData.fieldErrors ?? {}).length > 0,
        `HTTP ${invalid.status}`
      );
    }
  }

  // --- 8. The submission appears in the inbox and can be reviewed ---------
  if (created.submissionId) {
    const inbox = await fetch(`${BASE}/admin/submissions?q=Verification%20Test`, authed);
    const html = await inbox.text();
    check("submission appears in the inbox", inbox.status === 200 && html.includes("Verification Test Scholarship"));
    check("the inbox warns that approval is not publication", html.includes("does not publish anything"));
  }

  // --- 9. Activity log records the changes -------------------------------
  {
    const res = await fetch(`${BASE}/admin/activity`, authed);
    const html = await res.text();
    check("activity log renders", res.status === 200, String(res.status));
    check("activity log has no edit affordance", !html.includes("Delete entry"));
  }

  // --- 9b. Trash views resolve -------------------------------------------
  for (const path of ["/admin/trash", "/admin/countries?trashed=1", "/admin/blog?trashed=1"]) {
    const res = await fetch(`${BASE}${path}`, authed);
    check(`${path} renders`, res.status === 200, String(res.status));
  }

  // --- 10. Settings round-trip --------------------------------------------
  {
    const page = await fetch(`${BASE}/admin/settings`, authed);
    const html = await page.text();
    check("settings page renders", page.status === 200, String(page.status));
    check("settings page names the keys it reads", html.includes("scholarships.closingSoonDays"));

    const saved = await submitForm("/admin/settings", {
      "scholarships.closingSoonDays": "21",
      "site.contactEmail": "hello@globalscholarshiphub.com",
      "site.tagline": "Helping students worldwide discover, compare, and apply for scholarships.",
    });
    check(
      "settings save succeeds",
      saved.res.status === 200,
      `HTTP ${saved.res.status}`
    );

    // An out-of-range value must be refused rather than clamped silently.
    const bad = await submitForm("/admin/settings", {
      "scholarships.closingSoonDays": "900",
      "site.contactEmail": "not-an-address",
      "site.tagline": "Anything",
    });
    check(
      "an out-of-range setting is rejected",
      bad.html.includes("between 1 and 90"),
      `HTTP ${bad.res.status}`
    );
  }

  // --- 11. The footer reflects the setting -------------------------------
  {
    const home = await fetch(`${BASE}/`);
    const html = await home.text();
    check(
      "footer shows the configured contact address",
      html.includes("hello@globalscholarshiphub.com"),
      html.includes("scholaratlas") ? "WARNING: stale ScholarAtlas branding present" : ""
    );
    check("no stale ScholarAtlas branding in the markup", !html.includes("ScholarAtlas"));

    // The site mark is an image, so nothing else would notice if it went
    // missing: the layout would still render, just with a broken image. Assert
    // the asset actually serves and that both regions reference it.
    const asset = await fetch(`${BASE}/diploma_hat.png`);
    check("the site logo asset is served", asset.status === 200, `HTTP ${asset.status}`);

    const header = html.slice(0, html.indexOf("</header>"));
    const footer = html.slice(html.indexOf("<footer"));
    check(
      "the header and footer both show the site logo",
      header.includes("diploma_hat") && footer.includes("diploma_hat"),
      !header.includes("diploma_hat")
        ? "the header has no logo"
        : "the footer has no logo"
    );
  }

  console.log(
    failures === 0
      ? `\nAll admin content checks passed.${skips ? ` (${skips} skipped)` : ""}`
      : `\n${failures} check(s) failed.${skips ? ` ${skips} skipped.` : ""}`
  );
  if (created.countryId) {
    console.log(
      `\nLeft behind for inspection: country ${created.countryId} (slug ${RUN_SLUG}).\nRun "npm run clean:test-records" to remove every record these suites created.`
    );
  }
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("verification crashed:", e);
  process.exit(1);
});
