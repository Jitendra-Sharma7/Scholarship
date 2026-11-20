import { Suspense, cache } from "react";
import type { Metadata } from "next";
import {
  getPublicCountryOptions,
  getPublicFields,
  getPublicScholarships,
  getPublicIntakes,
} from "@/lib/data/public";
import { SCHOLARSHIP_PAGE_SIZE } from "@/lib/page-size";
import { DirectoryBrowser } from "./DirectoryBrowser";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { itemListSchema } from "@/lib/seo-jsonld";

const getCountries = cache(getPublicCountryOptions);
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
  intake: string;
  status: string;
  eligibleNationality: string;
  applicationFee: string;
  sortBy: string;
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
    intake: first(params.intake),
    status: first(params.status),
    eligibleNationality: first(params.eligibleNationality),
    applicationFee: first(params.applicationFee),
    sortBy: first(params.sortBy),
  };

  const [countryList, fieldList] = await Promise.all([
    raw.country ? getCountries() : Promise.resolve(null),
    raw.field ? getFields() : Promise.resolve(null),
  ]);
  if (raw.country && countryList && !countryList.some((c) => c.id === raw.country)) {
    raw.country = "";
  }
  if (raw.field && fieldList && !fieldList.some((f) => f.id === raw.field)) {
    raw.field = "";
  }
  return raw;
}

function filterQuery(f: ResolvedFilters): string {
  const parts = new URLSearchParams();
  for (const key of ["query", "country", "field", "degree", "funding", "intake", "status", "eligibleNationality", "applicationFee", "sortBy"] as const) {
    if (f[key]) parts.set(key, f[key]);
  }
  return parts.toString();
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const f = await resolveFilters(await searchParams);

  const [countries, fields] = await Promise.all([getCountries(), getFields()]);
  const countryName = countries.find((c) => c.id === f.country)?.name;
  const fieldName = fields.find((x) => x.id === f.field)?.name;

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
    title = "Scholarship Directory";
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
    path: `/directory${filterQuery(f) ? `?${filterQuery(f)}` : ""}`,
    noindex: isSearch,
  });
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = await resolveFilters(await searchParams);

  const [countries, fields, intakes, initialResult] = await Promise.all([
    getCountries(),
    getFields(),
    getPublicIntakes(),
    getPublicScholarships({ ...filters, page: 1, limit: SCHOLARSHIP_PAGE_SIZE }),
  ]);

  const { data: results } = initialResult;

  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-secondary-500">Loading scholarships...</div>}>
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

      <DirectoryBrowser
        countries={countries}
        fields={fields}
        intakes={intakes}
        initialResult={initialResult}
      />
    </Suspense>
  );
}