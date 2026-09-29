import { Globe } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { CountriesBrowser } from "@/components/public/CountriesBrowser";
import { getPublicCountries, toCountryCard } from "@/lib/data/public";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { itemListSchema } from "@/lib/seo-jsonld";

/**
 * Previously this page had no metadata, so it inherited the homepage's title,
 * description and `canonical: "/"` - and the homepage is not a list of
 * countries. The title now targets the head term this directory actually
 * competes for.
 */
export const metadata = pageMetadata({
  title: "Scholarships by Country - Study Destinations Worldwide",
  description:
    "Explore scholarships available in every country. Compare government and university-funded programmes, tuition coverage, living costs and application deadlines for each study destination.",
  path: "/countries",
});

export default async function CountriesPage() {
  // Narrowed to the nine fields a card renders. Passing the full record would
  // put every country's editorial copy into the browser payload for all 197 of
  // them, when twelve are on screen.
  const countries = (await getPublicCountries()).map(toCountryCard);

  return (
    <div className="bg-gray-50/50 min-h-screen py-10">
      <JsonLd
        data={itemListSchema({
          name: "Study destination countries",
          // The URLs match what each card actually links to, which filters the
          // scholarship listing by the country's record id. Emitting ISO codes
          // here instead would describe URLs that do not resolve.
          items: countries.map((c) => ({
            name: c.name,
            path: `/scholarships?country=${encodeURIComponent(c.id)}`,
            description: c.description,
          })),
        })}
      />
      <Container>
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 mb-3">
            <Globe className="h-3.5 w-3.5" />
            <span>Global Destinations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950">
            Scholarships by Destination Country
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">
            Explore government and university scholarship programs across top higher-education hubs
            worldwide.
          </p>
        </div>

        <CountriesBrowser countries={countries} />
      </Container>
    </div>
  );
}
