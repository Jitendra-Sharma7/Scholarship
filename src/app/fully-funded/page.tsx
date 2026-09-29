import { getPublicScholarships } from "@/lib/data/public";
import { getSettingNumber } from "@/lib/settings";
import FullyFundedClient from "./FullyFundedClient";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { itemListSchema } from "@/lib/seo-jsonld";

/**
 * "Fully funded" is the highest-intent query on a scholarship site, so the
 * title leads with it and the description spells out what "fully funded" means
 * here - tuition, and often accommodation and a living stipend - rather than
 * repeating the phrase without explaining it.
 */
export const metadata = pageMetadata({
  title: "Fully Funded Scholarships - Tuition, Living Costs & Stipend Covered",
  description:
    "Browse scholarships that cover the full cost of study: tuition, and in many cases accommodation and a monthly living stipend. Filter by country, degree level and deadline.",
  path: "/fully-funded",
});

export const dynamic = "force-dynamic";

/**
 * /fully-funded
 *
 * Derived from the same rows as /scholarships: an admin marking a record
 * "fully funded" is all that is required for it to appear here. There is no
 * second dataset to keep in sync.
 */
export default async function FullyFundedPage() {
  const closingSoonDays = await getSettingNumber("scholarships.closingSoonDays", 14);

  const { data } = await getPublicScholarships(
    { fullyFunded: true, limit: 60, sort: "deadline" },
    closingSoonDays
  );

  return (
    <>
      <JsonLd
        data={itemListSchema({
          name: "Fully funded scholarships",
          items: data.map((s) => ({
            name: s.title,
            path: `/scholarships/${s.slug}`,
            description: s.shortDescription ?? s.description,
          })),
        })}
      />
      <FullyFundedClient scholarships={data} />
    </>
  );
}
