/**
 * Indexability and structured-data checks.
 *
 * These guard a specific, expensive regression.
 *
 * Next.js merges metadata from the root layout down, so a `canonical` declared
 * on `layout.tsx` is inherited by every route that does not override it. The
 * root layout had `alternates: { canonical: "/" }`, which meant /scholarships,
 * /countries, /fields, /universities, /deadlines, /finder, /about, /contact and
 * /compare all told a crawler they were duplicates of the homepage. The pages
 * most likely to rank for "scholarships in Germany" were being declared
 * duplicates of the home page, and nothing in the build failed.
 *
 * The second failure mode is a page that quietly stops emitting its own title
 * and description and falls back to the root default. Ten pages did exactly
 * that.
 *
 * So the checks below assert, per page, that there is a canonical, that it is
 * the page's own address, that the title and description are unique and present,
 * and that the JSON-LD parses. A duplicated title across two indexable pages is
 * treated as a failure, because that is the symptom of the fallback.
 *
 * Needs a server on the base URL, read from `.env`.
 */
const BASE = resolveBase();

import { resolveBase } from "./lib/base-url.mjs";

/** The production origin. Canonicals must use this, not localhost. */
const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://globalscholarshiphub.com")
  .replace(/\/$/, "");

/**
 * Every public indexable route, with the structured-data types it must emit.
 * A page that loses its metadata loses its row here too.
 */
const PAGES = [
  { path: "/", types: ["WebSite", "Organization", "ItemList"] },
  { path: "/scholarships", types: ["ItemList"] },
  { path: "/countries", types: ["ItemList"] },
  { path: "/fields", types: ["ItemList"] },
  { path: "/universities", types: ["ItemList"] },
  { path: "/deadlines", types: ["ItemList"] },
  { path: "/fully-funded", types: ["ItemList"] },
  { path: "/blog", types: ["ItemList"] },
  { path: "/resources", types: ["ItemList"] },
  { path: "/faq", types: ["FAQPage"] },
  { path: "/finder", types: [] },
  { path: "/about", types: [] },
  { path: "/contact", types: [] },
];

/**
 * Filter variants. These are the long-tail landing pages, and they must each
 * carry their own title and self-canonical - the exact case that was broken
 * before. `?query=` is the one exception: it is unbounded, so it is expected to
 * be noindex.
 */
const FILTER_CASES = [
  { path: "/scholarships?country=gb", titleIncludes: "United Kingdom" },
  { path: "/scholarships?funding=fully-funded", titleIncludes: "Fully Funded" },
  { path: "/scholarships?degree=Master's", titleIncludes: "Master" },
  { path: "/scholarships?query=Chevening", noindex: true },
];

/** Detail pages are discovered from the sitemap so the check follows the data. */
const DETAIL_TYPES = {
  scholarship: ["EducationalOccupationalProgram", "BreadcrumbList"],
  blog: ["BlogPosting", "BreadcrumbList"],
  resource: ["Article", "BreadcrumbList"],
};

let failures = 0;
let checks = 0;
function check(label, ok, detail) {
  checks += 1;
  const note = !ok && detail ? `  -> ${detail}` : "";
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${note}`);
  if (!ok) failures += 1;
}

function meta(html, name) {
  const match = html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`));
  return match ? decodeEntities(match[1]) : null;
}

/**
 * OpenGraph and Twitter tags are emitted with `property=`, not `name=`.
 * Reading them with a name-based lookup silently finds nothing, so the two
 * attribute names are tried separately.
 */
function metaAny(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const byName = html.match(new RegExp(`<meta name="${escaped}" content="([^"]*)"`));
  if (byName) return decodeEntities(byName[1]);
  const byProperty = html.match(new RegExp(`<meta property="${escaped}" content="([^"]*)"`));
  return byProperty ? decodeEntities(byProperty[1]) : null;
}

function linkRel(html, rel) {
  const match = html.match(new RegExp(`<link rel="${rel}" href="([^"]*)"`));
  return match ? match[1] : null;
}

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};
function decodeEntities(value) {
  return value.replace(/&(amp|lt|gt|quot|#x27|#39|apos|nbsp);/g, (m) => ENTITIES[m] ?? m);
}

/** Every JSON-LD block on a page, parsed. Unparseable content is a failure. */
function jsonLdBlocks(html) {
  const blocks = [];
  const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch (error) {
      blocks.push({ __parseError: error.message });
    }
  }
  return blocks;
}

/**
 * Compares two canonical URLs, ignoring the two differences that are not
 * contradictions: a trailing slash, and percent-encoding of a query value.
 * Next.js emits `?degree=Master%27s` where the test string reads
 * `?degree=Master's`; both address the same page.
 */
function canonicalsMatch(actual, expected) {
  if (!actual) return false;
  const normalise = (value) => {
    try {
      const url = new URL(value);
      const decoded = decodeURIComponent(url.search);
      return `${url.origin}${url.pathname.replace(/\/$/, "")}${decoded}`.toLowerCase();
    } catch {
      return value.toLowerCase();
    }
  };
  return normalise(actual) === normalise(expected);
}

function assertPage(page, html, expectedCanonical, { allowNoindex = false } = {}) {
  const label = page;

  const canonical = linkRel(html, "canonical");
  check(
    `${label} emits a canonical`,
    Boolean(canonical),
    'no <link rel="canonical"> in the served HTML'
  );
  if (canonical) {
    check(
      `${label} canonical is its own address`,
      canonicalsMatch(canonical, expectedCanonical),
      `expected ${expectedCanonical}, got ${canonical}`
    );
    check(
      `${label} canonical uses the production origin`,
      canonical.startsWith(SITE_ORIGIN),
      `canonical points off-site: ${canonical}`
    );
  }

  const title = (html.match(/<title>([\s\S]*?)<\/title>/) ?? [])[1];
  check(`${label} has a title`, Boolean(title && title.trim()));
  check(
    `${label} title is not the bare homepage default`,
    !/^Global Scholarship Hub \| Global Scholarship/.test(title ?? ""),
    "page fell back to the root default title"
  );

  const description = meta(html, "description");
  check(`${label} has a meta description`, Boolean(description && description.trim()));
  check(
    `${label} description is a sensible length`,
    Boolean(description) && description.length >= 60 && description.length <= 200,
    `length ${description?.length ?? 0} is outside 60-200`
  );

  if (!allowNoindex) {
    const robots = meta(html, "robots") ?? "index, follow";
    check(
      `${label} is not blocked from the index`,
      !/noindex/i.test(robots),
      `robots=${robots}`
    );
  }

  // The social card, which is what decides whether anything is clickable from
  // a shared link.
  check(`${label} declares an og:image`, Boolean(metaAny(html, "og:image")));
  check(`${label} declares twitter:card`, Boolean(metaAny(html, "twitter:card")));

  return { title, description };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { "user-agent": "verify-seo" } });
  return { status: res.status, html: await res.text() };
}

async function main() {
  console.log(`verifying ${BASE}\n`);

  // --- Core pages -------------------------------------------------------
  const seenTitles = new Map();
  const seenDescriptions = new Map();

  for (const page of PAGES) {
    const { status, html } = await get(page.path);
    if (status !== 200) {
      check(`${page.path} responds 200`, false, `got ${status}`);
      continue;
    }

    const { title, description } = assertPage(page.path, html, `${SITE_ORIGIN}${page.path}`);

    // Two indexable pages sharing a title is the signature of metadata that
    // fell back to a shared default, so it is a failure in its own right.
    if (title) {
      const prior = seenTitles.get(title);
      check(
        `${page.path} title is unique`,
        !prior,
        prior ? `identical to the title on ${prior}` : ""
      );
      seenTitles.set(title, page.path);
    }
    if (description) {
      const prior = seenDescriptions.get(description);
      check(
        `${page.path} description is unique`,
        !prior,
        prior ? `identical to the description on ${prior}` : ""
      );
      seenDescriptions.set(description, page.path);
    }

    // --- Structured data ------------------------------------------------
    const blocks = jsonLdBlocks(html);
    const unparseable = blocks.filter((b) => b.__parseError);
    check(
      `${page.path} JSON-LD parses`,
      unparseable.length === 0,
      unparseable[0]?.__parseError
    );

    const types = blocks.map((b) => b["@type"]);
    for (const required of page.types) {
      check(
        `${page.path} declares ${required}`,
        types.includes(required),
        `found: ${types.join(", ") || "nothing"}`
      );
    }

    // Every @id and url in the markup must be absolute. Relative ids resolve
    // against the wrong origin once a page is syndicated or cached.
    const serialised = blocks.map((b) => JSON.stringify(b));
    check(
      `${page.path} JSON-LD uses absolute URLs`,
      serialised.every((s) => !/"\/[^"]*"/.test(s.replace(/"@(?:id|type)":"[^"]*"/g, ""))),
      "found a relative path in the markup"
    );
  }

  // --- Filter variants -------------------------------------------------
  console.log("");
  for (const testCase of FILTER_CASES) {
    const { html } = await get(testCase.path);
    const expected = `${SITE_ORIGIN}${testCase.path}`;

    const canonical = linkRel(html, "canonical");
    check(
      `${testCase.path} canonicals to itself`,
      canonicalsMatch(canonical, expected),
      `expected ${expected}, got ${canonical}`
    );

    const title = ((html.match(/<title>([\s\S]*?)<\/title>/) ?? [])[1] ?? "").replace(
      /&#x27;/g,
      "'"
    );
    if (testCase.titleIncludes) {
      check(
        `${testCase.path} title reflects the filter`,
        title.toLowerCase().includes(testCase.titleIncludes.toLowerCase()),
        `title was "${title}"`
      );
    }
    if (testCase.noindex) {
      const robots = meta(html, "robots") ?? "";
      check(
        `${testCase.path} free-text search is noindex`,
        /noindex/i.test(robots),
        `robots=${robots || "(none)"}`
      );
      check(
        `${testCase.path} free-text search still passes link equity`,
        /nofollow/i.test(robots) === false,
        `robots=${robots}`
      );
    }
  }

  // --- Detail pages ----------------------------------------------------
  console.log("");
  const sitemap = await (await get("/sitemap.xml")).html;

  const groups = [
    {
      key: "scholarship",
      route: "/scholarships",
      re: /https:\/\/globalscholarshiphub\.com\/scholarships\/([^<"?]+)</g,
    },
    { key: "blog", route: "/blog", re: /https:\/\/globalscholarshiphub\.com\/blog\/([^<"?]+)</g },
    {
      key: "resource",
      route: "/resources",
      re: /https:\/\/globalscholarshiphub\.com\/resources\/([^<"?]+)</g,
    },
  ];

  for (const group of groups) {
    // `matchAll` rather than `match`: with a capture group, `String.match`
    // returns the whole match, which would build a URL out of the full
    // absolute address and 404 on every one of them.
    const slugs = [...sitemap.matchAll(group.re)].map((m) => m[1]);
    if (slugs.length === 0) {
      check(`sitemap lists ${group.key} detail pages`, false, "none found");
      continue;
    }
    for (const slug of slugs.slice(0, 3)) {
      const path = `${group.route}/${slug}`;
      const { status, html } = await get(path);
      if (status !== 200) {
        check(`${path} responds 200`, false, `got ${status}`);
        continue;
      }
      assertPage(path, html, `${SITE_ORIGIN}${path}`);

      const types = jsonLdBlocks(html).map((b) => b["@type"]);
      for (const required of DETAIL_TYPES[group.key]) {
        check(
          `${path} declares ${required}`,
          types.includes(required),
          `found: ${types.join(", ") || "nothing"}`
        );
      }
    }
  }

  // --- Site-level files ------------------------------------------------
  console.log("");
  const robots = (await get("/robots.txt")).html;
  check("robots.txt names the sitemap", robots.includes(`${SITE_ORIGIN}/sitemap.xml`));

  const manifest = await get("/manifest.webmanifest");
  check("manifest.webmanifest responds 200", manifest.status === 200, `got ${manifest.status}`);
  if (manifest.status === 200) {
    try {
      const parsed = JSON.parse(manifest.html);
      check("manifest declares a name", Boolean(parsed.name));
      check("manifest declares a start_url", Boolean(parsed.start_url));
      check("manifest declares icons", Array.isArray(parsed.icons) && parsed.icons.length > 0);
    } catch (error) {
      check("manifest.webmanifest is valid JSON", false, error.message);
    }
  }

  const home = await (await get("/")).html;
  check("manifest is linked from the document head", /rel="manifest"/.test(home));

  console.log(
    `\n${failures} failure(s) across ${checks} checks.`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
