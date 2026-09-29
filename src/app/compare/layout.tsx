import { pageMetadata } from "@/lib/seo";

/**
 * `/compare` is a client component and cannot export `metadata`, so it is
 * declared on the route layout.
 *
 * It stays `noindex`: the comparison set lives in the visitor's own browser
 * state, so the page renders differently for every visitor and its content is
 * not crawlable. `robots.ts` already disallows the path; this makes the intent
 * explicit in the page head as well, in case a page is ever linked directly.
 */
export const metadata = pageMetadata({
  title: "Compare Scholarships Side by Side",
  description:
    "Put two or more scholarships side by side and compare funding, tuition coverage, deadlines and eligibility requirements.",
  path: "/compare",
  noindex: true,
});

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
