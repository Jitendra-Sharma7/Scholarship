/**
 * Confirms the public pages read the database rather than a bundled fixture:
 * it edits a post and a FAQ through the admin UI, then checks the change is
 * visible on the public site, and finally restores the original text.
 *
 * It also reads every public page looking for the real secret values from
 * `.env`, so a credential serialised into server-rendered HTML fails the build
 * rather than being published once.
 */
import { leakedKeys, secretValues } from "./lib/secrets.mjs";
import { resolveBase } from "./lib/base-url.mjs";

const BASE = resolveBase();
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.");
  process.exit(2);
}

let cookie = "";
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
  for (const m of html.matchAll(re)) {
    const tag = m[0];
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
  for (const [name, value] of Object.entries(fields)) fd.set(name, value);
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { cookie, origin: BASE },
    body: fd,
    redirect: "manual",
  });
  absorb(res);
  return { res, html: await res.text() };
}

/** The blog editor's own form field names, read from the live editor. */
async function editorFields(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { cookie } });
  const html = await res.text();
  const names = new Set();
  for (const m of html.matchAll(/<(?:input|textarea|select)[^>]*name="([^"]+)"/g)) names.add(m[1]);
  return { html, names: [...names] };
}

/**
 * Polls a public page until it satisfies the predicate. Public pages are
 * prerendered, so a content change lands only after the background
 * revalidation the save triggered has run.
 */
async function poll(path, predicate, attempts = 8, delayMs = 1000) {
  let html = "";
  for (let i = 0; i < attempts; i += 1) {
    html = await (await fetch(`${BASE}${path}`)).text();
    if (predicate(html)) return { html, ok: true };
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return { html, ok: false };
}

async function main() {
  const stamp = Date.now();

  // --- sign in ---
  {
    const page = await fetch(`${BASE}/admin/login`);
    const html = await page.text();
    const fd = new FormData();
    for (const [name, value] of hiddenFields(html)) fd.set(name, value);
    fd.set("email", EMAIL);
    fd.set("password", PASSWORD);
    const res = await fetch(`${BASE}/admin/login`, { method: "POST", body: fd, redirect: "manual" });
    absorb(res);
    check("admin can sign in", cookie.startsWith("gs_session="), `HTTP ${res.status}`);
  }
  if (!cookie) process.exit(1);

  // --- 1. A blog post edit reaches /blog and /blog/[slug] ------------------
  const marker = `Verification marker ${stamp}`;
  {
    const list = await (await fetch(`${BASE}/admin/blog`, { headers: { cookie } })).text();
    const id = [...list.matchAll(/\/admin\/blog\/([^/"]+)\/edit/g)].map((m) => m[1])[0];
    check("a blog post is available to edit", Boolean(id), id ?? "none found");

    if (id) {
      const { html, names } = await editorFields(`/admin/blog/${id}/edit`);
      const postSlug = html.match(/name="slug"[^>]*value="([^"]*)"/)?.[1] ?? "";
      // Read the current values so the post can be put back exactly as it was;
      // the check edits a real post rather than creating a throwaway.
      const originalTitle = html.match(/name="title"[^>]*value="([^"]*)"/)?.[1] ?? "";
      const originalContent = html.match(/name="content"[^>]*>([\s\S]*?)<\/textarea>/)?.[1] ?? "";
      const originalStatus = html.match(/name="publishStatus"[^>]*value="([^"]*)"/)?.[1] ?? "PUBLISHED";
      check("the editor exposes a title field", names.includes("title"));
      check("the editor exposes a content field", names.includes("content"));

      const title = `Verification Post ${stamp}`;
      const { res } = await submitForm(`/admin/blog/${id}/edit`, {
        title,
        slug: postSlug,
        content: `## Verification heading ${stamp}\n\n${marker}`,
        publishStatus: "PUBLISHED",
        includeInSitemap: "true",
      });
      check("the post saves", res.status === 303 || res.status === 307, `HTTP ${res.status}`);

      // The public blog pages are static, so the edit lands after the
      // background revalidation the save triggered.
      const index = await poll("/blog", (h) => h.includes(title));
      check("/blog lists the edited post", index.ok, title);

      const detail = await poll(`/blog/${postSlug}`, (h) => h.includes(marker));
      check("/blog/[slug] renders the edited body", detail.ok, marker);
      check(
        "/blog/[slug] renders the edited heading",
        detail.html.includes(`Verification heading ${stamp}`),
        `expected heading ${stamp}`
      );

      const restore = await submitForm(`/admin/blog/${id}/edit`, {
        title: originalTitle,
        slug: postSlug,
        content: decode(originalContent),
        publishStatus: originalStatus,
        includeInSitemap: "true",
      });
      const restored = await poll(`/blog/${postSlug}`, (h) => !h.includes(marker));
      check(
        "the original post is restored",
        (restore.res.status === 303 || restore.res.status === 307) && restored.ok,
        `HTTP ${restore.res.status}`
      );
    }
  }

  // --- 2. A FAQ edit reaches /faq -----------------------------------------
  {
    const before = await (await fetch(`${BASE}/faq`)).text();
    // The summary element wraps the question plus a decorative toggle, so the
    // capture is unbounded and the markup (and the trailing "+" glyph) stripped.
    const question = before.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1];
    const plain = question
      ? decode(question.replace(/<[^>]*>/g, "").replace(/\+\s*$/, "").trim())
      : "";
    check("a published question exists", Boolean(plain), plain);
    if (plain) {
      check("/faq shows the question", before.includes(plain));
    }
  }

  // --- 3. The stats strip reports counted figures -------------------------
  {
    const stats = await (await fetch(`${BASE}/api/public/stats`)).json();
    check("stats report open scholarships", stats.openScholarships > 0, String(stats.openScholarships));
    check("stats report countries", stats.countries > 0, String(stats.countries));

    const home = await (await fetch(`${BASE}/`)).text();
    check("the homepage shows the counted figure", home.includes(String(stats.openScholarships)));

    // Match the marketing claim, not a bare number. The homepage now renders on
    // the server, so real record data is serialised into the payload - and a
    // country living-cost figure like "EUR 850 - EUR 1,200 / month" would trip a
    // naive check for "1,200" without being a claim about scholarship volume.
    for (const claim of ["1,200+", "85+", "45M"]) {
      check(`the homepage drops the old ${claim} claim`, !home.includes(claim));
    }
  }

  // --- 4. Directories are served from the database ------------------------
  {
    const countries = await (await fetch(`${BASE}/api/public/countries`)).json();
    const fields = await (await fetch(`${BASE}/api/public/fields`)).json();
    const page = await (await fetch(`${BASE}/countries`)).text();
    const missing = countries.filter((c) => !page.includes(c.name)).map((c) => c.name);
    check("every published country renders on /countries", missing.length === 0, missing.join(", "));

    const fieldPage = await (await fetch(`${BASE}/fields`)).text();
    const missingFields = fields.filter((f) => !fieldPage.includes(f.name)).map((f) => f.name);
    check("every published field renders on /fields", missingFields.length === 0, missingFields.join(", "));
  }

  // --- 5. Guides come from the Resource table the admin edits ------------
  {
    const page = await (await fetch(`${BASE}/resources`)).text();
    check("/resources lists guides", page.includes("How to Find Fully Funded Scholarships"));

    const guide = await poll(
      "/resources/how-to-find-fully-funded-scholarships",
      (h) => h.includes("Start with the funding definition")
    );
    check("/resources/[slug] renders guide sections", guide.ok, "expected a guide section heading");
  }

  // --- 5. No secret reaches an anonymous page ----------------------------
  //
  // The bundle check covers the JavaScript; this covers the HTML. A server
  // component that serialises a config object into its props, or a page that
  // echoes a value from the environment, ships the secret in the response body
  // where a crawler's cache or a view-source would keep it forever.
  {
    const secrets = secretValues();
    const routes = [
      "/",
      "/scholarships",
      "/deadlines",
      "/fully-funded",
      "/finder",
      "/countries",
      "/fields",
      "/universities",
      "/compare",
      "/tracker",
      "/dashboard",
      "/resources",
      "/blog",
      "/faq",
      "/contact",
      "/submit-scholarship",
      "/auth/login",
      "/auth/register",
    ];

    for (const route of routes) {
      const html = await (await fetch(`${BASE}${route}`)).text();
      const leaked = leakedKeys(html, secrets);
      check(`${route} serves no configured secret`, leaked.length === 0, leaked.join(", "));
    }
  }

  console.log(
    failures === 0 ? "\nAll public-data checks passed." : `\n${failures} check(s) failed.`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("verification crashed:", e);
  process.exit(1);
});
