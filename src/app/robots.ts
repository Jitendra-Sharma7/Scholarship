import type { MetadataRoute } from "next";

/**
 * Keeps the routes that should never be crawled out of the index: the JSON
 * API, the staff panel, and the account pages behind a session.
 *
 * `/sitemap.xml` is advertised below and is built from the same published rows
 * the public pages read, so it can never list a draft or a deleted record.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", // JSON API: gated by proxy, and nothing here is for crawlers
          "/admin/", // staff panel
          "/auth/", // login and registration
          "/dashboard",
          "/tracker",
          "/compare",
        ],
      },
    ],
    sitemap: `${(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/sitemap.xml`,
  };
}
