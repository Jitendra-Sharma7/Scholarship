import { getPublicCountryOptions, getPublicFields } from "@/lib/data/public";
import { FinderQuestionnaire } from "./FinderQuestionnaire";
import { pageMetadata } from "@/lib/seo";

/**
 * The matcher is a client-side questionnaire, so this page cannot emit the
 * specific scholarships it recommends - but it can still be findable. Without a
 * title and description of its own it rendered the homepage's, and its
 * canonical pointed at the homepage.
 */
export const metadata = pageMetadata({
  title: "Scholarship Eligibility Matcher - Find What You Qualify For",
  description:
    "Answer a few questions about your degree level, field, funding needs and destination, and get matched to the scholarships you are actually eligible for.",
  path: "/finder",
});

/**
 * Server entry point. The questionnaire's options come from published records,
 * read here and passed down, so an option an editor unpublishes disappears from
 * the form instead of silently never matching.
 *
 * The countries are narrowed to the four fields the picker renders: the full
 * record carries a description, study notes and visa guidance per country, and
 * all of that would otherwise be read for 197 countries to read four fields
 * each.
 */
export default async function ScholarshipFinderPage() {
  const [countries, fields] = await Promise.all([
    getPublicCountryOptions(),
    getPublicFields(),
  ]);

  return <FinderQuestionnaire countries={countries} fields={fields} />;
}
