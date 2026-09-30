import type { Metadata } from "next";

/**
 * Global Scholarship Hub SEO configuration.
 *
 * IMPORTANT:
 * Set NEXT_PUBLIC_SITE_URL in Vercel:
 *
 * NEXT_PUBLIC_SITE_URL=https://globalscholarships.vercel.app
 *
 * Later, when you have a custom domain, change it there.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://globalscholarships.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "Global Scholarship Hub";

export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Global Scholarship Hub - Find scholarships, grants and fellowships worldwide.",
};

/**
 * Convert a relative URL into an absolute URL.
 */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Keep meta descriptions short enough for search results.
 */
export function clampDescription(
  text: string,
  max = 158
): string {
  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length <= max) {
    return clean;
  }

  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");

  return `${(
    lastSpace > 40 ? cut.slice(0, lastSpace) : cut
  ).trimEnd()}...`;
}

export interface PageMetadataInput {
  title: string;
  description: string;
  path: string;

  type?: "website" | "article";

  publishedTime?: string;
  modifiedTime?: string;

  section?: string;

  tags?: string[];

  image?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };

  noindex?: boolean;

  keywords?: string[];
}

/**
 * Generate consistent SEO metadata.
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

    alternates: {
      canonical,
    },

    robots: noindex
      ? {
        index: false,
        follow: true,
      }
      : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },

    openGraph: {
      type,
      url: canonical,
      siteName: SITE_NAME,
      title,
      description: desc,
      locale: "en_US",

      images: [
        {
          url: image.url,
          width: image.width ?? 1200,
          height: image.height ?? 630,
          alt: image.alt,
        },
      ],

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
