import type { Metadata } from "next";

/**
 * Site-wide SEO identity.
 *
 * Everything that has to agree on the canonical origin reads it from here. The
 * canonical is set per route by `pageMetadata()` rather than in the root layout:
 * Next.js merges metadata down the tree, so a layout-level `canonical: "/"`
 * would give every page that did not override it a pointer back to the homepage
 * and get those routes dropped from the index as duplicates.
 */

/** Absolute origin, no trailing slash. Used for canonicals and JSON-LD ids. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://globalscholarshiphub.com"
);

export const SITE_NAME = "Global Scholarship Hub";

/** Shared social card. 1200x630 is the size both OpenGraph and X expect. */
export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Global Scholarship Hub - search scholarships, grants and fellowships worldwide.",
};

/**
 * No `twitter:site` handle is declared, deliberately. A handle that has not
 * been verified points the attribution at somebody else's account, so it is
 * left unset rather than guessed.
 */

/** Builds an absolute URL from a site-relative path. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Trims a description to what a SERP will actually render.
 *
 * Google displays roughly 155-160 characters and truncates the rest with an
 * ellipsis, so a longer string is wasted pixels. Cutting mid-word reads badly
 * in the search results, so the last word is dropped rather than sliced.
 */
export function clampDescription(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}...`;
}

export interface PageMetadataInput {
  /** Rendered as `%s | Global Scholarship Hub` by the root title template. */
  title: string;
  description: string;
  /** Site-relative canonical path, e.g. "/scholarships" or "/blog/post-slug". */
  path: string;
  /** `article` for blog posts and guides so social cards render as articles. */
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  /** Overrides `OG_IMAGE`; pass a scholarship or post cover image. */
  image?: { url: string; alt: string; width?: number; height?: number };
  /** Renders `noindex, nofollow` while still letting links pass through. */
  noindex?: boolean;
  keywords?: string[];
}

/**
 * Builds a complete, self-consistent `Metadata` for a page.
 *
 * Title, description, OpenGraph, Twitter and the canonical are all derived
 * from the same two strings, so they cannot drift apart the way hand-written
 * per-platform blocks do. Every page that should be indexed should use this
 * rather than a bare `export const metadata`.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  publishedTime,
  modifiedTime,
  section,
  tags,
  image = OG_IMAGE,
  noindex = false,
  keywords,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const desc = clampDescription(description);

  return {
    title,
    description: desc,
    keywords,
    alternates: { canonical },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type,
      url: canonical,
      siteName: SITE_NAME,
      title,
      description: desc,
      locale: "en_US",
      images: [image],
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime,
            ...(section ? { section } : {}),
            ...(tags?.length ? { tags } : {}),
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [image.url],
    },
  };
}
