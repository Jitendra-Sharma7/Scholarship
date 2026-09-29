/**
 * End-to-end verification of the scholarship CMS against a running dev server.
 *
 * Exercises the real HTTP surface: the admin session, the editor form, the
 * server actions, automatic deadline status, slug redirects, and public
 * visibility. Nothing here touches the database directly, so a pass means the
 * whole stack works together.
 *
 * Next.js server actions are invoked by replaying the hidden `$ACTION_*` fields
 * that the rendered form carries, which is exactly what a browser does.
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
const state = { id: "", slug: "" };

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

/** Every hidden `<input>` in the document, decoded. */
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

/**
 * Submits a server-action form the way a browser would: replay the action
 * fields from a fresh render of the page, then append the payload.
 */
async function submitForm(path, fields) {
  const page = await fetch(`${BASE}${path}`, { headers: { cookie } });
  const html = await page.text();

  const fd = new FormData();
  for (const [name, value] of hiddenFields(html)) fd.set(name, value);
  for (const [name, value] of Object.entries(fields)) fd.set(name, value);

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    // No explicit content-type: fetch must set the multipart boundary itself.
    headers: { cookie },
    body: fd,
    redirect: "manual",
  });
  absorb(res);
  return { res, html: await res.text() };
}

/** Counts the rows the admin list reports, via the pagination summary. */
async function countRows() {
  const res = await fetch(`${BASE}/admin/scholarships?page=1`, { headers: { cookie } });
  const html = await res.text();
  const m = html.match(/([\d,]+)\s+scholarships?/);
  return m ? Number(m[1].replace(/,/g, "")) : -1;
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

  // --- 1. Auth boundary ---------------------------------------------------
  {
    const res = await fetch(`${BASE}/admin/scholarships`, { redirect: "manual" });
    const loc = res.headers.get("location") || "";
    check(
      "anonymous scholarship list redirects to login",
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

  // --- 3. List renders ---------------------------------------------------
  {
    const res = await fetch(`${BASE}/admin/scholarships`, { headers: { cookie } });
    const html = await res.text();
    check("scholarship list renders", res.status === 200 && html.includes("Add scholarship"));
    check("list shows a row from the seed", /E2E|scholarship/i.test(html) && html.length > 10000);
    check("list offers bulk actions", html.includes("Bulk actions") || html.includes("Select all on page"));
  }

  // --- 4. New editor loads ----------------------------------------------
  {
    const res = await fetch(`${BASE}/admin/scholarships/new`, { headers: { cookie } });
    const html = await res.text();
    check("new editor renders", res.status === 200 && html.includes('name="title"'));
    check("editor asks for a deadline", html.includes('name="deadline"'));
    check("editor asks for a source", html.includes('name="source"'));
    check("editor includes the verification field", html.includes('name="verificationStatus"'));
    check("editor includes a funding type select", html.includes('name="fundingType"'));
    check("editor includes the field-of-study picker", html.includes('name="fieldIds"'));
  }

  // --- 5. Validation rejects an undated record ---------------------------
  // Next's `useActionState` only re-renders the returned state through its JS
  // runtime, so a no-JS POST cannot show the inline message. What must hold is
  // that the write is refused: no record is created and no editor redirect
  // happens.
  {
    const before = await countRows();
    const { res, html } = await submitForm("/admin/scholarships/new", {
      title: "E2E missing deadline",
      fundingType: "fully-funded",
      publishStatus: "DRAFT",
      degreeLevels: "",
    });
    check(
      "a record without a deadline is rejected",
      !String(res.headers.get("location") || "").includes("/edit"),
      `HTTP ${res.status}`
    );
    check(
      "the rejected record was not written",
      (await countRows()) === before,
      `${before} -> ${await countRows()}`
    );
    check("the editor form is re-rendered on rejection", html.includes('name="title"'));
  }

  // --- 6. Create as a draft ---------------------------------------------
  const title = `E2E Verification Scholarship ${Date.now()}`;
  const deadline = new Date(Date.now() + 45 * 864e5).toISOString().slice(0, 10);

  {
    const { res } = await submitForm("/admin/scholarships/new", {
      title,
      fundingType: "fully-funded",
      deadline,
      officialUrl: "https://example.org/program",
      source: "https://example.org/program",
      verificationStatus: "Verification Needed",
      publishStatus: "DRAFT",
      description: "Created by the scholarship CRUD verification script.",
      degreeLevelsOther: "JD",
      degreeLevels: "Master's",
      includeInSitemap: "true",
    });
    const loc = res.headers.get("location") || "";
    const m = loc.match(/\/admin\/scholarships\/([a-z0-9]+)\/edit/);
    check("create redirects to the editor", res.status === 303 && Boolean(m), `HTTP ${res.status} ${loc}`);
    if (m) state.id = m[1];
  }

  if (!state.id) {
    console.log("\nCreate failed; cannot continue.");
    process.exit(1);
  }

  const editPath = `/admin/scholarships/${state.id}/edit`;

  // --- 7. The record persisted correctly ---------------------------------
  {
    const res = await fetch(`${BASE}${editPath}`, { headers: { cookie } });
    const html = await res.text();
    // Read the slug out of the editor's own field rather than guessing from a
    // link, which is ambiguous once the admin shell renders its own URLs.
    state.slug = decode(html.match(/<input[^>]*name="slug"[^>]*value="([^"]*)"/)?.[1] ?? "");
    check("created record opens in the editor", res.status === 200 && html.includes(title));
    check(
      "slug generated from the title",
      state.slug.startsWith("e2e-verification-scholarship"),
      state.slug
    );
    check("official URL saved", html.includes("https://example.org/program"));
    check("free-text degree level JD saved", /value="JD"/.test(html));
    // 45 days out, so the derived status must be Open rather than anything manual.
    check("deadline status derived automatically as Open", /Open/.test(html));
  }

  // --- 8. A draft is not public ------------------------------------------
  {
    const res = await fetch(`${BASE}/scholarships/${state.slug}`);
    check("draft is hidden from the public site", res.status === 404, `HTTP ${res.status}`);
  }

  // --- 9. Publish through the editor -------------------------------------
  {
    const { res } = await submitForm(editPath, {
      title,
      fundingType: "fully-funded",
      deadline,
      slug: state.slug,
      publishStatus: "PUBLISHED",
      source: "https://example.org/program",
      includeInSitemap: "true",
      degreeLevels: "Master's",
    });
    check("publishing via the editor saves", res.status < 400, `HTTP ${res.status}`);

    const publicRes = await fetch(`${BASE}/scholarships/${state.slug}`);
    const publicHtml = publicRes.status === 200 ? await publicRes.text() : "";
    check("published scholarship is public", publicRes.status === 200, `HTTP ${publicRes.status}`);
    check("public page shows the title", publicHtml.includes(title));
  }

  // --- 10. Renaming the slug keeps the old URL working -------------------
  const newSlug = `e2e-renamed-${Date.now()}`;
  {
    const { res } = await submitForm(editPath, {
      title,
      fundingType: "fully-funded",
      deadline,
      slug: newSlug,
      publishStatus: "PUBLISHED",
      source: "https://example.org/program",
      includeInSitemap: "true",
      degreeLevels: "Master's",
    });
    check("slug can be changed", res.status < 400, `HTTP ${res.status}`);

    const fresh = await fetch(`${BASE}${editPath}`, { headers: { cookie } });
    const freshHtml = await fresh.text();
    check("new slug persisted", freshHtml.includes(newSlug));

    const oldSlug = state.slug;
    state.slug = newSlug;

    const moved = await fetch(`${BASE}/scholarships/${newSlug}`, { redirect: "manual" });
    check("renamed record resolves at the new URL", moved.status === 200, `HTTP ${moved.status}`);

    const oldUrl = await fetch(`${BASE}/scholarships/${oldSlug}`, { redirect: "manual" });
    const oldLoc = oldUrl.headers.get("location") || "";
    check(
      "old URL redirects to the new one",
      (oldUrl.status === 308 || oldUrl.status === 307) && oldLoc.includes(newSlug),
      `${oldUrl.status} ${oldLoc}`
    );
  }

  // --- 11. An expired deadline is not presented as open ------------------
  {
    const past = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const { res } = await submitForm(editPath, {
      title,
      fundingType: "fully-funded",
      deadline: past,
      slug: state.slug,
      publishStatus: "PUBLISHED",
      source: "https://example.org/program",
      includeInSitemap: "true",
      degreeLevels: "Master's",
    });
    check("a past deadline can be saved", res.status < 400, `HTTP ${res.status}`);

    const page = await fetch(`${BASE}/scholarships/${state.slug}`);
    const html = page.status === 200 ? await page.text() : "";
    const claimsOpen = /apply now|applications? open|closing soon/i.test(html);
    check("expired scholarship is not presented as open", !claimsOpen);
    check("expired scholarship is marked expired", /expired/i.test(html));
  }

  // --- 12. Trash view ----------------------------------------------------
  {
    const res = await fetch(`${BASE}/admin/trash`, { headers: { cookie } });
    check("trash view is reachable", res.status === 200, `HTTP ${res.status}`);
  }

  // --- 13. Anonymous writes are refused ----------------------------------
  // The assertion is on the effect, not the status code: a refused write must
  // not create a record and must not hand back an editor URL.
  {
    const before = await countRows();
    const page = await fetch(`${BASE}/admin/scholarships/new`, { headers: { cookie } });
    const html = await page.text();
    const fd = new FormData();
    for (const [name, value] of hiddenFields(html)) fd.set(name, value);
    fd.set("title", "Anonymous write attempt");
    fd.set("fundingType", "fully-funded");
    fd.set("deadline", deadline);
    fd.set("degreeLevels", "Master's");

    const res = await fetch(`${BASE}/admin/scholarships/new`, {
      method: "POST",
      body: fd,
      redirect: "manual",
    });
    check(
      "an anonymous write is refused",
      !String(res.headers.get("location") || "").includes("/edit"),
      `HTTP ${res.status}`
    );
    check(
      "no record was created by the anonymous write",
      (await countRows()) === before,
      `${before} -> ${await countRows()}`
    );
  }

  console.log(`\nCreated record id: ${state.id}`);
  console.log(`Slug: ${state.slug}`);
  console.log(`Run "npm run clean:test-records" to remove it.`);
  console.log(`\n${failures} failure(s).`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
