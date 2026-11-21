import { getPublicUniversities, getPublicUniversityFilterOptions, getPublicStats } from "@/lib/data/public";
import type { PaginatedUniversities, UniversityFilterOptions } from "@/lib/data/public";
import JsonLd from "@/components/seo/JsonLd";
import { itemListSchema } from "@/lib/seo-jsonld";
import { pageMetadata } from "@/lib/seo";
import { UniversityHero } from "@/components/university-directory/UniversityHero";
import { UniversityDirectoryClient } from "@/components/university-directory/UniversityDirectoryClient";
import { DirectoryCta } from "@/components/university-directory/DirectoryCta";
import { UNIVERSITY_PAGE_SIZE } from "@/lib/page-size";

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

export default async function UniversitiesPage({
  searchParams,
}: {
  searchParams: Promise<PublicSearchParams>;
}) {
  const params = await searchParams;

  const page = Math.max(parseInt(asString(params.page, "1"), 10) || 1, 1);
  const limit = UNIVERSITY_PAGE_SIZE;
  const q = asString(params.q, "");
  const country = asString(params.country, "all");
  const studyLevel = asString(params.studyLevel, "all");
  const scholarships = asString(params.scholarships, "all");
  const field = asString(params.field, "all");
  const intake = asString(params.intake, "all");
  const tuitionRange = asString(params.tuitionRange, "all");
  const sort = (asString(params.sort, "ranking") as
    | "ranking"
    | "lowest"
    | "name"
    | "scholarships") ?? "ranking";
  const view = asString(params.view, "grid") === "list" ? "list" : "grid";

  let result: PaginatedUniversities | null = null;
  let filterOptions: UniversityFilterOptions | null = null;
  let stats: {
    universities: number;
    countries: number;
    openScholarships: number;
    totalCourses: number;
  } | null = null;
  let error: Error | null = null;

  try {
    [result, filterOptions, stats] = await Promise.all([
      getPublicUniversities({
        limit,
        page,
        includeScholarships: true,
        query: q || undefined,
        country: country !== "all" ? country : undefined,
        studyLevel: studyLevel !== "all" ? studyLevel : undefined,
        scholarships: scholarships !== "all" ? scholarships : undefined,
        field: field !== "all" ? field : undefined,
        intake: intake !== "all" ? intake : undefined,
        tuitionRange: tuitionRange !== "all" ? tuitionRange : undefined,
        sort,
      }),
      getPublicUniversityFilterOptions(),
      getPublicStats(),
    ]);
  } catch (err) {
    error = err instanceof Error ? err : new Error("Failed to load universities");
    result = {
      data: [],
      total: 0,
      page: 1,
      totalPages: 1,
      hasMore: false,
    };
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
    stats = { universities: 0, countries: 0, openScholarships: 0, totalCourses: 0 };
  }

  const universities = result?.data ?? [];
  const totalUniversities = stats?.universities ?? 0;
  const totalPages = result?.totalPages ?? 1;

  return (
    <div className="max-w-[1240px] mx-auto px-5 min-h-screen font-onest bg-[#F3F7FF]">
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

      <UniversityHero
        totalUniversities={totalUniversities}
        totalCourses={stats?.totalCourses ?? 0}
        totalScholarships={stats?.openScholarships ?? 0}
        searchValue={q}
      />

      <UniversityDirectoryClient
        universities={universities}
        filterOptions={filterOptions}
        totalUniversities={totalUniversities}
        totalPages={totalPages}
        currentPage={page}
        filters={{
          q,
          country,
          studyLevel,
          scholarships,
          field,
          intake,
          tuitionRange,
          sort,
          view,
          category: "all",
        }}
        error={error}
      />

      <DirectoryCta />
    </div>
  );
}
