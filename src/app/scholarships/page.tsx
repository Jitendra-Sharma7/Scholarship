import { Suspense, cache } from "react";
import type { Metadata } from "next";
import {
  getPublicCountries,
  getPublicFields,
  getPublicScholarships,
  toCountryOption,
} from "@/lib/data/public";
import { SCHOLARSHIP_PAGE_SIZE } from "@/lib/page-size";
import { ScholarshipsBrowser } from "./ScholarshipsBrowser";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { itemListSchema } from "@/lib/seo-jsonld";

/**
 * `cache()` so `generateMetadata` and the page component share one round trip.
 * Both need the country and field lists, and without this they run the same
 * two queries twice on every request.
 */
const getCountries = cache(getPublicCountries);
const getFields = cache(getPublicFields);

const first = (value: string | string[] | undefined): string => {
  const raw = (Array.isArray(value) ? value[0] : value) ?? "";
  return raw.trim();
};

interface ResolvedFilters {
  query: string;
  country: string;
  field: string;
  degree: string;
  funding: string;
}

async function resolveFilters(
  params: Record<string, string | string[] | undefined>
): Promise<ResolvedFilters> {
  const raw: ResolvedFilters = {
    query: first(params.query),
    country: first(params.country),
    field: first(params.field),
    degree: first(params.degree),
    funding: first(params.funding),
  };

  // An unknown id is dropped rather than rendered into the title, so a
  // hand-edited URL cannot produce a page called "Scholarships in Antarctica".
  if (raw.country) {
    const countries = await getCountries();
    if (!countries.some((c) => c.id === raw.country)) raw.country = "";
  }
  if (raw.field) {
    const fields = await getFields();
    if (!fields.some((f) => f.id === raw.field)) raw.field = "";
  }
  return raw;
}

/** Rebuilds the query string from the filters that actually resolved. */
function filterQuery(f: ResolvedFilters): string {
  const parts = new URLSearchParams();
  for (const key of ["query", "country", "field", "degree", "funding"] as const) {
    if (f[key]) parts.set(key, f[key]);
  }
  return parts.toString();
}

/**
 * Filter-aware metadata for the listing.
 *
 * Previously this page emitted no metadata at all, so every variant -
 * `/scholarships`, `/scholarships?country=de`, `/scholarships?funding=fully-funded`
 * - rendered the homepage's title and description, and all of them inherited
 * the root `canonical: "/"`. That is the worst of both: the pages Google most
 * wants to show for "scholarships in Germany" were indistinguishable from each
 * other and were all declared duplicates of the homepage.
 *
 * Each resolved filter now gets its own title, description and self-referencing
 * canonical, which is what makes the directory rank for country and degree
 * long-tails rather than only for the head term.
 *
 * The brand is not written into these titles: the root layout's
 * `title.template` already appends "| Global Scholarship Hub" to every child
 * route, so including it here would repeat it.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const f = await resolveFilters(await searchParams);

  const [countries, fields] = await Promise.all([getCountries(), getFields()]);
  const countryName = countries.find((c) => c.id === f.country)?.name;
  const fieldName = fields.find((x) => x.id === f.field)?.name;

  // Free-text search is an unbounded space: every distinct string is a distinct
  // URL. Those are marked noindex but still followable, so the links inside them
  // keep passing PageRank to the detail pages.
  const isSearch = Boolean(f.query);

  let title: string;
  if (isSearch) {
    title = `Search Results for "${f.query}"`;
  } else if (fieldName) {
    title = countryName
      ? `${fieldName} Scholarships in ${countryName}`
      : `${fieldName} Scholarships`;
  } else if (f.degree) {
    title = countryName
      ? `${f.degree} Scholarships in ${countryName}`
      : `${f.degree} Scholarships`;
  } else if (countryName) {
    title = `Scholarships in ${countryName}`;
  } else if (f.funding === "fully-funded") {
    title = "Fully Funded Scholarships";
  } else {
    title = "Scholarships";
  }

  const qualifiers = [
    countryName,
    fieldName,
    f.degree || null,
    f.funding === "fully-funded" ? "fully funded" : null,
  ].filter(Boolean) as string[];

  const description = isSearch
    ? `Search results for "${f.query}" across global scholarships, grants and fellowships. Compare deadlines, funding amounts and eligibility requirements.`
    : `Browse${
        countryName ? ` ${countryName}` : ""
      }${fieldName ? ` ${fieldName.toLowerCase()}` : ""}${
        f.degree ? ` ${f.degree.toLowerCase()}` : ""
      } scholarships${
        f.funding === "fully-funded" ? " that are fully funded" : ""
      }. Compare funding amounts, tuition coverage, deadlines and eligibility, and apply before the closing date.`;

  return pageMetadata({
    title,
    description: qualifiers.length ? `${description} Filtering by ${qualifiers.join(", ")}.` : description,
    path: `/scholarships${filterQuery(f) ? `?${filterQuery(f)}` : ""}`,
    noindex: isSearch,
  });
}

/**
 * Server entry point. The filter options are read here and handed to the
 * browser component as props, so the page never asks the browser to fetch them.
 *
 * The first page of results is read here too, from the same `?query=`,
 * `?country=`, `?field=`, `?degree=` and `?funding=` parameters the browser
 * component will use. Fetching them in an effect instead left the served HTML
 * with nothing but loading skeletons, which meant a crawler without JavaScript
 * saw an empty results page.
 */
export default async function ScholarshipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = await resolveFilters(await searchParams);

  const [countries, fields, initialResult] = await Promise.all([
    getCountries(),
    getFields(),
    getPublicScholarships({ ...filters, page: 1, limit: SCHOLARSHIP_PAGE_SIZE }),
  ]);

  const { data: results } = initialResult;

  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-gray-500">Loading scholarships...</div>}>
      {/* The results are already server-rendered, so the list is fully visible
          in the served HTML. The schema mirrors that exact array. */}
      <JsonLd
        data={itemListSchema({
          name: "Scholarships",
          items: results.map((s) => ({
            name: s.title,
            path: `/scholarships/${s.slug}`,
            description: s.shortDescription ?? s.description,
          })),
        })}
      />

      {/* The filter only reads a country's id, name and code; the rest of the
          record is editorial copy the browser never renders. */}
      <ScholarshipsBrowser
        countries={countries.map(toCountryOption)}
        fields={fields}
        initialResult={initialResult}
      />
    </Suspense>
  );
}
