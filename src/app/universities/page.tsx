import { GraduationCap } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { UniversityDirectory } from "@/components/public/UniversityDirectory";
import {
  getPublicUniversities,
  getPublicUniversityFilterOptions,
} from "@/lib/data/public";
import JsonLd from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { itemListSchema } from "@/lib/seo-jsonld";
import type {
  PublicUniversity,
  UniversityFilterOptions,
} from "@/lib/data/public";
import type { DirectoryState } from "@/components/public/UniversityDirectory";

export const metadata = pageMetadata({
  title: "University Directory - Top Universities Offering Scholarships",
  description:
    "Browse and compare universities offering scholarships to international students. Explore rankings, programmes, tuition, admission requirements and the scholarship schemes available at each institution.",
  path: "/universities",
});

type PublicSearchParams = { [key: string]: string | string[] | undefined };

function asString(value: string | string[] | undefined, fallback: string): string {
  if (value === undefined || value === "") return fallback;
  return Array.isArray(value) ? value[0] : value;
}

function initialDirectoryState(searchParams: PublicSearchParams): DirectoryState {
  return {
    country: asString(searchParams.c, "all"),
    ranking: asString(searchParams.r, "all"),
    studyLevel: asString(searchParams.l, "all"),
    scholarships: asString(searchParams.s, "all"),
    field: asString(searchParams.f, "all"),
    type: asString(searchParams.t, "all"),
    intake: asString(searchParams.i, "all"),
    q: asString(searchParams.q, ""),
    sort: asString(searchParams.sort, "ranking"),
    view: asString(searchParams.view, "grid") === "list" ? "list" : "grid",
    page: Math.max(
      parseInt(asString(searchParams.page, "1"), 10) || 1,
      1
    ),
  };
}

export default async function UniversitiesPage({
  searchParams,
}: {
  searchParams: Promise<PublicSearchParams>;
}) {
  const params = await searchParams;
  const initial = initialDirectoryState(params);

  let universities: PublicUniversity[] = [];
  let filterOptions: UniversityFilterOptions | null = null;
  let error: Error | null = null;

  try {
    [universities, filterOptions] = await Promise.all([
      getPublicUniversities({ includeScholarships: true }),
      getPublicUniversityFilterOptions(),
    ]);
  } catch (err) {
    error = err instanceof Error ? err : new Error("Failed to load universities");
    universities = [];
    filterOptions = {
      countries: [],
      types: [],
      fields: [],
      intakes: [],
      studyLevels: [
        { value: "ug", label: "Undergraduate" },
        { value: "pg", label: "Postgraduate" },
        { value: "phd", label: "PhD / Doctoral" },
      ],
    };
  }

  const totalUniversities = universities.length;
  const countriesCount = filterOptions.countries.length;
  const universitiesWithScholarships = universities.filter(
    (u) => u.scholarshipCount > 0
  ).length;

  return (
    <div className="bg-secondary-50/50 min-h-screen">
      <JsonLd
        data={itemListSchema({
          name: "Universities offering scholarships",
          items: universities.map((u) => ({
            name: u.name,
            path: `/universities/${u.slug ?? u.id}`,
            description: u.description,
          })),
        })}
      />
      <Container>
        {/* Page header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 mb-3">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Academic Institutions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-secondary-950">
            Global University Directory
          </h1>
          <p className="mt-3 text-base text-secondary-600 max-w-2xl">
            Discover and compare universities offering scholarships to
            international students. Explore verified rankings, programmes,
            tuition and funding opportunities across institutions worldwide.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-secondary-500">
            <span className="font-semibold text-secondary-900">
              {totalUniversities.toLocaleString()} universities
            </span>
            <span className="px-1">·</span>
            <span>
              {countriesCount.toLocaleString()} countries
            </span>
            <span className="px-1">·</span>
            <span>
              {universitiesWithScholarships.toLocaleString()} offering{" "}
              scholarships
            </span>
          </div>
        </div>

        <UniversityDirectory
          universities={universities}
          filterOptions={filterOptions}
          totalUniversities={totalUniversities}
          countriesCount={countriesCount}
          universitiesWithScholarships={universitiesWithScholarships}
          initial={initial}
          error={error}
        />
      </Container>
    </div>
  );
}
