import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

/**
 * Sitemap for the public, crawlable site.
 *
 * Every entry is read from the same published rows the public pages read, so a
 * draft, an archived record, a deleted record or an editorial post dated in the
 * future can never be advertised here. The routes robots.txt disallows are
 * absent by construction: they are session-scoped or staff-scoped, and there is
 * nothing a crawler should be pointed at.
 */

const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.APP_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

/** Same visibility rule as the public read model. */
const VISIBLE = { publishStatus: "PUBLISHED" as const, deletedAt: null };

/**
 * Regenerate at most once an hour.
 *
 * Without this the route is prerendered at build time and served from that
 * snapshot forever, which is wrong for a sitemap: it is assembled from a
 * database that admins edit through the CMS, so a scholarship published after a
 * deploy would never be advertised and a renamed one would stay listed until it
 * 404s. An hourly rebuild costs one indexed query per hour, and a stale sitemap
 * costs search visibility, so the stale window is what is being bounded here.
 */
export const revalidate = 3600;

interface Entry {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}

const STATIC_ROUTES: Entry[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/scholarships", priority: 0.9, changeFrequency: "daily" },
  { path: "/deadlines", priority: 0.9, changeFrequency: "daily" },
  { path: "/fully-funded", priority: 0.8, changeFrequency: "daily" },
  { path: "/finder", priority: 0.8, changeFrequency: "monthly" },
  { path: "/countries", priority: 0.8, changeFrequency: "weekly" },
  { path: "/fields", priority: 0.7, changeFrequency: "weekly" },
  { path: "/universities", priority: 0.7, changeFrequency: "weekly" },
  { path: "/resources", priority: 0.7, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/about", priority: 0.4, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.3, changeFrequency: "yearly" },
  { path: "/advertise", priority: 0.3, changeFrequency: "yearly" },
  { path: "/submit-scholarship", priority: 0.4, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  /**
   * The database-backed half of the sitemap.
   *
   * This route is evaluated during `next build`, and an unreachable
   * `DATABASE_URL` would otherwise fail the entire deployment. The static
   * routes are still correct without a database, so they are emitted and the
   * database sections degrade to empty rather than taking the build down.
   *
   * Because `revalidate` is 3600, a sitemap assembled this way is replaced
   * within the hour with the full list. The warning is deliberately loud: a
   * sitemap that silently loses 50 scholarship URLs is worse than a failed
   * build that someone notices, so this must never pass unremarked.
   */
  let scholarships: { slug: string; updatedAt: Date }[] = [];
  let posts: { slug: string; updatedAt: Date }[] = [];
  let resources: { slug: string; updatedAt: Date }[] = [];

  try {
    [scholarships, posts, resources] = await Promise.all([
      prisma.scholarship.findMany({
        where: VISIBLE,
        select: { slug: true, updatedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { ...VISIBLE, publishedAt: { not: null, lte: now } },
        select: { slug: true, updatedAt: true },
      }),
      // The legacy Guide table is merged into the public resources list, so its
      // published rows are advertised too. A guide whose slug a resource already
      // occupies resolves to the same URL either way.
      Promise.all([
        prisma.resource.findMany({ where: VISIBLE, select: { slug: true, updatedAt: true } }),
        prisma.guide.findMany({
          where: { published: true, deletedAt: null },
          select: { slug: true, updatedAt: true },
        }),
      ]).then(([fromResources, fromGuides]) => [...fromResources, ...fromGuides]),
    ]);
  } catch (error) {
    console.warn(
      "[build] sitemap could not read the database. Emitting the static routes only; " +
        "scholarship, blog and resource URLs are missing and will return on the next " +
        "revalidation. Check DATABASE_URL.",
      error instanceof Error ? error.message : error
    );
  }

  const entries: MetadataRoute.Sitemap = [
    // No lastModified for the static routes on purpose. Stamping them with the
    // request time would tell every crawler the privacy policy was rewritten
    // today, contradicting the changeFrequency on the same entry and training
    // crawlers to re-fetch pages that never change. A real edit to one of these
    // files is what should move its date, and that is rare enough to notice.
    ...STATIC_ROUTES.map((route) => ({
      url: `${BASE}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...scholarships.map((s) => ({
      url: `${BASE}/scholarships/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...resources.map((r) => ({
      url: `${BASE}/resources/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  // A guide whose slug a resource already occupies resolves to the same URL, so
  // the merged list above can name one address twice. Sitemaps are allowed to
  // repeat a URL, but a duplicate reads as two pages competing for the same
  // query and wastes crawl budget, so collapse to the first entry per address.
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
