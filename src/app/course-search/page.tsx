import { Suspense, cache } from "react";
import type { Metadata } from "next";
import { getPublicCourses, getCourseSearchOptions } from "@/lib/data/course-search";
import {
  resolveCourseQuery,
  courseFiltersToQuery,
  type CourseFilterState,
} from "@/lib/course-search";
import { SCHOLARSHIP_PAGE_SIZE } from "@/lib/page-size";
import { pageMetadata } from "@/lib/seo";
import { itemListSchema } from "@/lib/seo-jsonld";
import JsonLd from "@/components/seo/JsonLd";
import { CourseSearchBrowser } from "./CourseSearchBrowser";

/**
 * Unified Course Search.
 *
 * Every "Courses by Degree / Subject / Country" navigation link lands here with
 * only the query string differing (`?degree=masters`, `?subject=business`,
 * `?country=germany`, `?country=europe`). The server resolves those friendly
 * slugs to concrete values, reads the first page of matching course records
 * from the dedicated Course data source, and hands both the filter options and
 * the results to the browser component.
 *
 * Courses and scholarships are separate data sources: this page never reads or
 * falls back to scholarship rows. When no course matches, the browser shows a
 * "No courses available" empty state.
 */

const getOptions = cache(getCourseSearchOptions);

const first = (value: string | string[] | undefined): string => {
  const raw = (Array.isArray(value) ? value[0] : value) ?? "";
  return raw.trim();
};

function readState(
  params: Record<string, string | string[] | undefined>,
): CourseFilterState {
  return {
    degree: first(params.degree),
    subject: first(params.subject),
    country: first(params.country),
    university: first(params.university),
    studyMode: first(params.studyMode),
    duration: first(params.duration),
    tuitionFee: first(params.tuitionFee),
    courseType: first(params.courseType),
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const state = readState(await searchParams);
  const options = await getOptions();
  const resolved = resolveCourseQuery(state, options);

  const degreeLabel = options.degrees.find((d) => d.value === resolved.degree)?.label;
  const subjectLabel = options.subjects.find((s) => s.id === resolved.field)?.name;
  const countryLabel =
    options.countries.find((c) => c.id === resolved.country)?.name ?? resolved.region;

  const parts = [subjectLabel, degreeLabel, countryLabel].filter(Boolean) as string[];
  const title = parts.length
    ? `${parts.join(" in ")} Courses`
    : "Explore Courses Worldwide";

  const query = courseFiltersToQuery(state);
  const description = parts.length
    ? `Browse ${parts.join(" ")} courses from accredited universities worldwide. Compare degrees, subjects, tuition, duration and study mode, and find the right programme.`
    : "Search courses and programmes worldwide by degree, subject and country. Compare tuition, duration and study mode from accredited universities.";

  return pageMetadata({
    title,
    description,
    path: `/course-search${query ? `?${query}` : ""}`,
  });
}

export default async function CourseSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = readState(await searchParams);
  const options = await getOptions();
  const resolved = resolveCourseQuery(state, options);

  // The URL carries friendly slugs; the DB stores the subject display name, so
  // resolve the subject id back to its label before querying courses.
  const subjectName = resolved.field
    ? options.subjects.find((s) => s.id === resolved.field)?.name ?? resolved.field
    : undefined;

  const initialResult = await getPublicCourses({
    degree: resolved.degree || undefined,
    subject: subjectName || undefined,
    country: resolved.country || undefined,
    region: resolved.region || undefined,
    university: resolved.university || undefined,
    studyMode: resolved.studyMode || undefined,
    duration: resolved.duration || undefined,
    tuitionFee: resolved.tuitionFee || undefined,
    courseType: resolved.courseType || undefined,
    page: 1,
    limit: SCHOLARSHIP_PAGE_SIZE,
  });

  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-gray-500">
          Loading courses...
        </div>
      }
    >
      <JsonLd
        data={itemListSchema({
          name: "Courses",
          items: initialResult.data.map((c) => ({
            name: c.title,
            path: c.url ?? `/course-search`,
            description: c.shortDescription ?? c.description,
          })),
        })}
      />

      <CourseSearchBrowser
        options={options}
        initialState={state}
        initialResult={initialResult}
      />
    </Suspense>
  );
}