/**
 * Site identity values shown in the public layout.
 *
 * Deliberately dependency-free. This module is imported by client components
 * for its types and its fallback values, so it must not reach the database - a
 * transitive import of `lib/settings` would pull Prisma into the browser
 * bundle. The server-side reader lives in `site-branding-server.ts`.
 *
 * `scripts/verify-client-bundle.mjs` fails the build if the client bundle ever
 * contains the Prisma runtime again.
 */

export interface SiteBranding {
  contactEmail: string;
  tagline: string;
}

export const SITE_BRANDING_FALLBACK: SiteBranding = {
  contactEmail: "hello@globalscholarshiphub.com",
  tagline:
    "Helping students worldwide discover, compare, and apply for scholarships, grants, fellowships, and financial-aid opportunities.",
};

/**
 * A stored contact address that is not an address would put a broken `mailto:`
 * on every page, so the server reader falls back rather than rendering it.
 */
export function isValidContactEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
