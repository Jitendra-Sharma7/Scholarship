import { pageMetadata } from "@/lib/seo";

/**
 * `/about` is a client component, and Next.js does not allow a `"use client"`
 * file to export `metadata`. The route-level layout carries it instead, which
 * is the supported way to attach metadata to a client-rendered page.
 */
export const metadata = pageMetadata({
  title: "About Us - How We Source and Verify Scholarship Data",
  description:
    "Learn how Global Scholarship Hub sources, verifies and publishes scholarship listings, who we are, and the editorial standards we hold ourselves to.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
