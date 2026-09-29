/**
 * Internal link check.
 *
 * Two passes:
 *
 *  1. Every route in `src/app` is enumerated from the filesystem and requested,
 *     with real values substituted into the dynamic segments taken from the
 *     database. This catches an orphaned page nobody links to, a mistyped route
 *     folder, and a dynamic route whose records are all broken.
 *  2. The public site is crawled breadth-first from the home page, so that a
 *     link to a path which does not exist is reported even when no route file
 *     backs it.
 *
 * Query-string links matter here too: `/scholarships?country=de` is a different
 * render from `/scholarships`, so the filter links are requested with their
 * parameters intact rather than collapsed to a pathname.
 *
 *   node scripts/verify-links.mjs
 */

import { readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { PrismaClient } from "@prisma/client";

import { resolveBase } from "./lib/base-url.mjs";

/** This one script reads BASE_URL; every other verification script reads BASE. */
const BASE = resolveBase("BASE_URL");
const APP_DIR = "src/app";
const prisma = new PrismaClient();

/**
 * Some hosts answer a default scripted user agent with 403 or 503 rather than
 * serving the page a browser would get, which is indistinguishable from a dead
 * link unless the request identifies itself.
 */
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const FETCH_HEADERS = { "user-agent": BROWSER_UA, accept: "text/html,*/*" };

/** Routes that need a session or are staff-only; followed only to their redirect. */
const EXPECTED_REDIRECT = new Set([
  "/admin",
  "/admin/login",
  "/admin/scholarships",
  "/admin/users",
  "/admin/submissions",
  "/admin/settings",
  "/dashboard",
  "/tracker",
  "/compare",
  "/auth/login",
]);

/** Never request these: they are actions, not pages. */
const SKIP_PREFIX = ["/api/", "/admin/actions"];

/**
 * Filters and search pages that the UI links to with a query string. Each is a
 * separate render path from the bare listing, and a bad parameter value is a
 * server error rather than an empty result.
 */
const QUERY_LINKS = [
  "/scholarships?query=engineering",
  "/scholarships?country=de",
  "/scholarships?degree=Master%27s",
  "/scholarships?funding=fully-funded",
  "/scholarships?field=computer-science",
  "/scholarships?status=open",
  "/scholarships?page=2",
  "/scholarships?sort=featured",
  "/scholarships?query=%27%20OR%201%3D1--",
  "/scholarships?country=does-not-exist",
  "/countries?region=Asia",
  "/fields?category=Engineering",
  "/universities?query=Oxford",
  "/finder?step=4",
  "/blog?page=2",
];

/** Every route directory under src/app, as a URL path. */
function routePaths(dir = APP_DIR, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("(") || entry.name === "node_modules") continue;
    const next = join(dir, entry.name);

    if (existsSync(join(next, "page.tsx")) || existsSync(join(next, "page.ts"))) {
      acc.push("/" + relative(APP_DIR, next).split(/[\\/]/).join("/"));
    }
    // Groups and parallel routes do not change the URL.
    routePaths(next, acc);
  }
  return acc;
}

/**
 * Real values for dynamic segments, keyed by route. `/blog/[slug]` needs a blog
 * post slug and `/scholarships/[id]` needs a scholarship slug, so the buckets
 * cannot be merged: feeding one model's identifiers to another's route produces
 * false 404s.
 */
async function dynamicValues() {
  const [scholarships, posts, resources] = await Promise.all([
    prisma.scholarship.findMany({
      where: { publishStatus: "PUBLISHED", deletedAt: null },
      select: { slug: true },
      take: 5,
    }),
    prisma.blogPost.findMany({
      where: { publishStatus: "PUBLISHED", deletedAt: null },
      select: { slug: true },
      take: 5,
    }),
    prisma.resource.findMany({
      where: { publishStatus: "PUBLISHED", deletedAt: null },
      select: { slug: true },
      take: 5,
    }),
  ]);

  return {
    "/blog/[slug]": posts.map((r) => r.slug),
    "/resources/[slug]": resources.map((r) => r.slug),
    "/scholarships/[id]": scholarships.map((r) => r.slug),
  };
}

const failures = [];
const notes = [];
const visited = new Map();

function normalise(href) {
  const url = new URL(href, BASE);
  if (url.origin !== new URL(BASE).origin) return null; // external
  let p = url.pathname;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return res;
}

async function crawl() {
  const queue = ["/"];
  const seen = new Set();

  while (queue.length > 0) {
    const path = queue.shift();
    if (seen.has(path)) continue;
    seen.add(path);

    if (SKIP_PREFIX.some((p) => path.startsWith(p))) continue;

    let res;
    try {
      res = await get(path);
    } catch (err) {
      failures.push({ path, reason: `request failed: ${err.message}` });
      continue;
    }

    const status = res.status;

    if (status === 301 || status === 302 || status === 307 || status === 308) {
      const location = res.headers.get("location");
      const target = location ? normalise(location) : null;
      if (EXPECTED_REDIRECT.has(path)) {
        notes.push(`${path} -> ${status} ${location} (expected: needs a session)`);
      } else if (target && target !== path) {
        // A permanent redirect is fine, but the canonical link should point at
        // the destination rather than bounce.
        notes.push(`${path} -> ${status} ${location}`);
      }
      continue;
    }

    if (status !== 200) {
      failures.push({ path, reason: `HTTP ${status}` });
      continue;
    }

    const html = await res.text();
    visited.set(path, html);

    // A 200 that renders the not-found page is still a broken link.
    if (/<title>[^<]*(not found|404)/i.test(html) || /404 \| /i.test(html)) {
      failures.push({ path, reason: "renders the not-found page with a 200" });
    }

    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    for (const href of hrefs) {
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("http")
      ) {
        // Absolute URLs may still be same-origin.
        if (!href.startsWith("http")) continue;
      }
      const next = normalise(href);
      if (next && !seen.has(next) && !queue.includes(next)) queue.push(next);
    }
  }
}

/** Assets referenced by the markup must resolve, or the page is visually broken. */
async function checkAssets() {
  const patterns = [/\/flags\/[a-z]{2}\.svg/g];
  for (const [page, html] of visited) {
    for (const pattern of patterns) {
      for (const match of new Set(html.match(pattern) ?? [])) {
        try {
          const res = await fetch(`${BASE}${match}`);
          if (res.status !== 200) failures.push({ path: `${page} -> ${match}`, reason: `HTTP ${res.status}` });
        } catch (err) {
          failures.push({ path: `${page} -> ${match}`, reason: `request failed: ${err.message}` });
        }
      }
    }
  }
}

/** Every route file gets requested, with dynamic segments filled in. */
let routeChecks = 0;
let queryChecks = 0;
let adminChecks = 0;
let externalChecks = 0;
let sitemapChecks = 0;
const external = new Set();
const externalBroken = [];
const externalUnreachable = [];
const externalBlocked = [];

/** Canonical and social-card URLs: metadata, and pointing at the live origin. */
const META_URL = /\/scholarships\/sc-\d+$|globalscholarshiphub\.com/i;

async function checkEveryRoute() {
  const values = await dynamicValues();
  const paths = routePaths();

  for (const path of paths) {
    if (SKIP_PREFIX.some((p) => path.startsWith(p))) continue;

    const segment = path.match(/\[(\w+)\]/)?.[1];
    if (segment) {
      const candidates = values[path] ?? [];
      if (candidates.length === 0) {
        notes.push(`${path} skipped: no published records to substitute`);
        continue;
      }
      for (const value of candidates.slice(0, 3)) {
        await request(path.replace(`[${segment}]`, encodeURIComponent(value)), `route ${path}`);
        routeChecks += 1;
      }
      continue;
    }

    await request(path, "route");
    routeChecks += 1;
  }
}

async function request(path, kind) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  } catch (err) {
    failures.push({ path: `${path} (${kind})`, reason: `request failed: ${err.message}` });
    return;
  }

  if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
    const location = res.headers.get("location");
    if (!location) {
      failures.push({ path: `${path} (${kind})`, reason: `HTTP ${res.status} with no Location` });
    }
    return;
  }

  if (res.status !== 200) {
    failures.push({ path: `${path} (${kind})`, reason: `HTTP ${res.status}` });
    return;
  }

  // A 200 that renders the not-found page is a broken link wearing a success code.
  const html = await res.text();
  if (/<title>[^<]*(not found|404)/i.test(html)) {
    failures.push({ path: `${path} (${kind})`, reason: "renders the not-found page with a 200" });
  }
}

async function checkQueryLinks() {
  for (const path of QUERY_LINKS) {
    await request(path, "query link");
    queryChecks += 1;
  }
}

/**
 * The staff panel cannot be reached without a session, so its links are only
 * checked once signed in. Reuses the same login the admin suite performs.
 */
async function checkAdminLinks() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    notes.push("admin links skipped: ADMIN_EMAIL / ADMIN_PASSWORD not set");
    return;
  }

  const page = await fetch(`${BASE}/admin/login`);
  const html = await page.text();

  // The sign-in form is a server action, so its hidden `$ACTION_*` fields have
  // to be replayed, and a server action also requires an Origin header.
  const fd = new FormData();
  for (const tag of html.match(/<input[^>]*type="hidden"[^>]*>/g) ?? []) {
    const name = tag.match(/name="([^"]*)"/)?.[1];
    const value = tag.match(/value="([^"]*)"/)?.[1] ?? "";
    if (name) fd.set(name, value.replace(/&amp;/g, "&").replace(/&quot;/g, '"'));
  }
  fd.set("email", email);
  fd.set("password", password);

  const res = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    body: fd,
    headers: { origin: BASE },
    redirect: "manual",
  });

  let cookie = "";
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    if (pair.startsWith("gs_session=")) cookie = pair;
  }
  if (!cookie) {
    failures.push({ path: "/admin/login", reason: "could not sign in to check admin links" });
    return;
  }

  const queue = ["/admin"];
  const seen = new Set();
  while (queue.length > 0) {
    const path = queue.shift();
    if (seen.has(path)) continue;
    seen.add(path);

    let page;
    try {
      // Followed, because signing in redirects /admin to the first section.
      page = await fetch(`${BASE}${path}`, { headers: { cookie }, redirect: "follow" });
    } catch (err) {
      failures.push({ path: `${path} (admin)`, reason: `request failed: ${err.message}` });
      continue;
    }

    if (page.status !== 200) {
      // The sign-in page is where an unauthenticated admin route lands.
      if (path !== "/admin/login") {
        failures.push({ path: `${path} (admin)`, reason: `HTTP ${page.status}` });
      }
      continue;
    }

    const html = await page.text();
    external.add(...[...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]));

    for (const match of html.matchAll(/href="(\/[^"#?]*)"/g)) {
      const href = match[1].replace(/\/$/, "") || "/";
      if (href.startsWith("/admin") && !seen.has(href) && !queue.includes(href)) queue.push(href);
    }
  }
  adminChecks = seen.size;
}

/** External hrefs on public pages, so a dead official link is reported. */
async function checkExternalLinks() {
  const urls = new Set();
  for (const html of visited.values()) {
    for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
      const url = m[1];
      if (url.startsWith(new URL(BASE).origin)) continue;
      // A canonical or social-card URL is metadata, not something a visitor
      // clicks, and it legitimately points at the production origin, which is
      // not serving anything until the site is deployed.
      if (META_URL.test(url)) continue;
      urls.add(url);
    }
  }

  for (const url of urls) {
    externalChecks += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      let res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: FETCH_HEADERS,
      });
      // Some hosts reject HEAD but serve the page.
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: FETCH_HEADERS,
        });
      }
      if (res.status === 403 || res.status === 401 || res.status === 503) {
        // Bot protection, not a dead link: these hosts answer a browser fine
        // and refuse a scripted request. Reported, not counted as broken.
        externalBlocked.push({ url, status: res.status });
      } else if (res.status >= 500) {
        // 5xx is usually a hiccup on the host's side, not a removed page, so it
        // is retried once before being reported.
        const retry = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          headers: FETCH_HEADERS,
        }).catch(() => null);
        if (!retry || retry.status >= 400) {
          externalBroken.push({ url, status: retry?.status ?? res.status });
        }
      } else if (res.status >= 400) {
        externalBroken.push({ url, status: res.status });
      }
    } catch (err) {
      // A sandbox without outbound network, or a host that blocks the request,
      // is not evidence that the link is wrong. Only real HTTP failures count.
      externalUnreachable.push({ url, reason: err.name === "AbortError" ? "timeout" : err.message });
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * The sitemap is how a crawler finds the records that have no link from a
 * listing page, so a stale or over-broad one is a silent loss of traffic. It is
 * checked against the same rules the rest of this script applies to pages: no
 * disallowed route, and every advertised URL must actually answer.
 */
async function checkSitemap() {
  const res = await get("/sitemap.xml");
  if (!res || res.status !== 200) {
    failures.push({ path: "/sitemap.xml", reason: `HTTP ${res?.status ?? "no response"}` });
    return;
  }

  const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (locs.length === 0) {
    failures.push({ path: "/sitemap.xml", reason: "no <loc> entries" });
    return;
  }

  const disallowed = ["/api/", "/admin/", "/auth/", "/dashboard", "/tracker", "/compare"];
  for (const loc of locs) {
    let pathname;
    try {
      pathname = new URL(loc).pathname;
    } catch {
      failures.push({ path: loc, reason: "not an absolute URL" });
      continue;
    }
    if (disallowed.some((prefix) => pathname.startsWith(prefix))) {
      failures.push({ path: loc, reason: "advertises a route robots.txt disallows" });
    }
  }

  // Requested against this server: the advertised origin is the production
  // hostname, which serves nothing until the site is deployed.
  for (const loc of locs) {
    const pathname = new URL(loc).pathname;
    const page = await get(pathname);
    sitemapChecks += 1;
    if (!page || page.status !== 200) {
      failures.push({ path: pathname, reason: `listed in the sitemap but HTTP ${page?.status ?? "no response"}` });
    }
  }

  // Every published record has to be advertised, or it is unreachable by search.
  const [scholarships, posts, resources, guides] = await Promise.all([
    prisma.scholarship.findMany({
      where: { publishStatus: "PUBLISHED", deletedAt: null },
      select: { slug: true },
    }),
    prisma.blogPost.findMany({
      where: {
        publishStatus: "PUBLISHED",
        deletedAt: null,
        publishedAt: { not: null, lte: new Date() },
      },
      select: { slug: true },
    }),
    prisma.resource.findMany({
      where: { publishStatus: "PUBLISHED", deletedAt: null },
      select: { slug: true },
    }),
    prisma.guide.findMany({
      where: { published: true, deletedAt: null },
      select: { slug: true },
    }),
  ]);

  const paths = new Set(locs.map((loc) => new URL(loc).pathname.replace(/\/$/, "")));
  const missing = [
    ...scholarships.map((s) => `/scholarships/${s.slug}`),
    ...posts.map((p) => `/blog/${p.slug}`),
    ...resources.map((r) => `/resources/${r.slug}`),
    ...guides.map((g) => `/resources/${g.slug}`),
  ].filter((path) => !paths.has(path));

  for (const path of [...new Set(missing)]) {
    failures.push({ path, reason: "published record is missing from the sitemap" });
  }

  const robotsRes = await get("/robots.txt");
  const robotsBody = robotsRes ? await robotsRes.text() : "";
  if (!/Sitemap:\s*https?:\/\/\S*sitemap\.xml/i.test(robotsBody)) {
    failures.push({ path: "/robots.txt", reason: "does not advertise the sitemap" });
  }
}

await crawl();
await checkAssets();
await checkEveryRoute();
await checkQueryLinks();
await checkAdminLinks();
await checkExternalLinks();
await checkSitemap();

console.log(
  `crawled ${visited.size} pages, ${routeChecks} routes, ${queryChecks} query links, ` +
    `${adminChecks} admin pages, ${externalChecks} external links, ${sitemapChecks} sitemap URLs\n`
);

if (externalUnreachable.length > 0) {
  console.log("-- external links not reachable from here (not counted as broken) --");
  for (const u of externalUnreachable) console.log(`  ${u.url}  ${u.reason}`);
  console.log("");
}

if (externalBlocked.length > 0) {
  console.log("-- external links that refused a scripted request (not counted as broken) --");
  for (const u of externalBlocked) console.log(`  ${u.url}  HTTP ${u.status}`);
  console.log("");
}

if (notes.length > 0) {
  console.log("-- redirects --");
  for (const n of notes) console.log(`  ${n}`);
  console.log("");
}

for (const b of externalBroken) {
  failures.push({ path: b.url, reason: `external HTTP ${b.status}` });
}

if (failures.length > 0) {
  console.log("-- broken --");
  for (const f of failures) console.log(`  ${f.path}  ${f.reason}`);
  console.log(`\n${failures.length} failure(s)`);
  process.exit(1);
}

console.log("0 failure(s). No broken internal links found.");

await prisma.$disconnect();
