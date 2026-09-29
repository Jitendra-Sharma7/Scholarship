import { prisma } from "@/lib/prisma";

/**
 * URL slug generation and preservation.
 *
 * Changing a published record's slug would otherwise break every inbound link
 * and search-engine ranking, so `changeSlugWithRedirect` records a permanent
 * redirect from the old path before the slug moves.
 */

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    // Strip accents so "Ökademie" becomes "okademie" rather than dropping out.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/**
 * Returns a slug that is not yet taken on the given model.
 *
 * `excludeId` lets an edit keep its own slug while checking for collisions.
 */
export async function generateUniqueSlug(
  model: "scholarship" | "university" | "country" | "field" | "blogPost" | "resource" | "guide",
  desired: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(desired) || "untitled";

  for (let n = 1; n < 500; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const found =
      model === "scholarship"
        ? await prisma.scholarship.findUnique({ where: { slug: candidate }, select: { id: true } })
        : model === "university"
          ? await prisma.university.findUnique({ where: { slug: candidate }, select: { id: true } })
          : model === "country"
            ? await prisma.country.findUnique({ where: { slug: candidate }, select: { id: true } })
            : model === "field"
              ? await prisma.field.findUnique({ where: { slug: candidate }, select: { id: true } })
              : model === "blogPost"
                ? await prisma.blogPost.findUnique({ where: { slug: candidate }, select: { id: true } })
                : model === "resource"
                  ? await prisma.resource.findUnique({ where: { slug: candidate }, select: { id: true } })
                  : await prisma.guide.findUnique({ where: { slug: candidate }, select: { id: true } });

    if (!found || found.id === excludeId) return candidate;
  }

  // Practically unreachable; guarantees a terminating value.
  return `${base}-${Date.now()}`;
}

/**
 * Public path for a given entity, used to build redirects.
 *
 * Only scholarships, blog posts and resources have a public detail page. A
 * country, university or field is reached through a list filtered by id
 * (`/scholarships?country=…`), so there is no slug URL to preserve and none is
 * invented here.
 */
export function publicPathFor(
  model: "scholarship" | "university" | "country" | "field" | "blogPost" | "resource",
  slug: string
): string | null {
  switch (model) {
    case "scholarship":
      return `/scholarships/${slug}`;
    case "blogPost":
      return `/blog/${slug}`;
    case "resource":
      return `/resources/${slug}`;
    default:
      return null;
  }
}

/** True when the entity is addressable by slug on the public site. */
export function hasPublicSlugPage(
  model: "scholarship" | "university" | "country" | "field" | "blogPost" | "resource"
): boolean {
  return publicPathFor(model, "x") !== null;
}

/**
 * Records a permanent redirect from `oldSlug` to `newSlug`.
 *
 * Existing rows are left alone rather than deleted, so a slug that has already
 * been reused and re-changed keeps its history.
 */
export async function changeSlugWithRedirect(
  model: "scholarship" | "university" | "country" | "field" | "blogPost" | "resource",
  oldSlug: string,
  newSlug: string
): Promise<void> {
  if (!oldSlug || !newSlug || oldSlug === newSlug) return;

  const fromPath = publicPathFor(model, oldSlug);
  const toPath = publicPathFor(model, newSlug);
  // Nothing to preserve for a model with no public slug URL.
  if (!fromPath || !toPath) return;

  await prisma.redirect.upsert({
    where: { fromPath },
    update: { toPath, isPermanent: true },
    create: { fromPath, toPath, isPermanent: true },
  });

  // The resolver caches the table; a fresh redirect has to be visible now, not
  // after the cache expires.
  invalidateRedirectCache();
}

/** Small module cache so a public page does not query redirects repeatedly. */
const REDIRECT_TTL_MS = 60_000;
let redirectCache: { at: number; byPath: Map<string, string> } | null = null;

/**
 * Resolves a request path to a replacement path, or `null` when it is current.
 *
 * Called from the public pages rather than from middleware: this project has no
 * middleware, and resolving here means a lookup can be cached alongside the page
 * data instead of running on every request including static assets.
 */
export async function resolveRedirect(pathname: string): Promise<string | null> {
  if (!pathname || pathname === "/") return null;

  const now = Date.now();
  const fresh = redirectCache && now - redirectCache.at < REDIRECT_TTL_MS;
  if (!fresh) {
    const rows = await prisma.redirect.findMany({ select: { fromPath: true, toPath: true } });
    redirectCache = { at: now, byPath: new Map(rows.map((r) => [r.fromPath, r.toPath])) };
  }

  return redirectCache?.byPath.get(pathname) ?? null;
}

/** Drops the redirect cache so a newly written redirect takes effect at once. */
export function invalidateRedirectCache(): void {
  redirectCache = null;
}
