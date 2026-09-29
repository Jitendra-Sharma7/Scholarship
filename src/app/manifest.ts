import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";

/**
 * Web app manifest.
 *
 * Previously the site shipped no manifest, so installing it to a home screen
 * produced an unbranded, unthemed shortcut. The icons reference assets that
 * already exist rather than adding new binaries.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} - Global Scholarship Discovery Platform`,
    short_name: SITE_NAME,
    description:
      "Search scholarships, grants and fellowships from around the world, filter by country, field and degree level, and track application deadlines.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    categories: ["education", "reference"],
    icons: [
      {
        src: "/diploma_hat.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    shortcuts: [
      {
        name: "Search scholarships",
        short_name: "Search",
        url: "/scholarships",
      },
      {
        name: "Fully funded scholarships",
        short_name: "Fully funded",
        url: "/fully-funded",
      },
      {
        name: "Application deadlines",
        short_name: "Deadlines",
        url: "/deadlines",
      },
    ],
  };
}
