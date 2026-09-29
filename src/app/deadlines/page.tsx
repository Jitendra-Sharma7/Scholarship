import { getPublicScholarships } from "@/lib/data/public";
import { DeadlineList } from "./DeadlineList";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { itemListSchema } from "@/lib/seo-jsonld";

/**
 * The deadline calendar is one of the few pages that serves real search intent
 * on its own ("scholarship deadlines 2026"), so the title carries the year
 * rather than the generic word. It previously had no metadata and inherited the
 * homepage's.
 */
export const metadata = pageMetadata({
  title: "Scholarship Application Deadlines - Dates That Are Still Open",
  description:
    "Track scholarship application deadlines in one place, sorted by closing date. See which applications are still open, which are closing soon, and the funding attached to each deadline.",
  path: "/deadlines",
});

/**
 * Server entry point. The calendar is read here and handed to the browser
 * component already sorted by closing date.
 */
export default async function DeadlinesPage() {
  const { data } = await getPublicScholarships({ limit: 50 });
  const sorted = data
    .filter((s) => s.deadline)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return (
    <>
      <JsonLd
        data={itemListSchema({
          name: "Scholarship application deadlines",
          items: sorted.map((s) => ({
            name: s.title,
            path: `/scholarships/${s.slug}`,
          })),
        })}
      />
      <DeadlineList scholarships={sorted} />
    </>
  );
}
