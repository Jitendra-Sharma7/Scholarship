"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Inbox, RotateCcw, Filter, X, Home } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { CourseCard } from "@/components/course-search/CourseCard";
import { CourseFilters } from "@/components/course-search/CourseFilters";
import { fetchPublicCourses } from "@/app/actions/public-actions";
import {
  resolveCourseQuery,
  courseFiltersToQuery,
  EMPTY_COURSE_FILTERS,
  type CourseFilterState,
  type CourseSearchOptions,
} from "@/lib/course-search";
import type { Paginated } from "@/lib/data/public";
import type { PublicCourse } from "@/lib/data/course-search";
import { SCHOLARSHIP_PAGE_SIZE } from "@/lib/page-size";

interface CourseSearchBrowserProps {
  options: CourseSearchOptions;
  initialState: CourseFilterState;
  initialResult: Paginated<PublicCourse>;
}

type FilterKey = keyof CourseFilterState;

export function CourseSearchBrowser({
  options,
  initialState,
  initialResult,
}: CourseSearchBrowserProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const readState = (): CourseFilterState => ({
    degree: searchParams.get("degree") ?? "",
    subject: searchParams.get("subject") ?? "",
    country: searchParams.get("country") ?? "",
    university: searchParams.get("university") ?? "",
    studyMode: searchParams.get("studyMode") ?? "",
    duration: searchParams.get("duration") ?? "",
    tuitionFee: searchParams.get("tuitionFee") ?? "",
    courseType: searchParams.get("courseType") ?? "",
  });

  const [filters, setFilters] = useState<CourseFilterState>(initialState);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<PublicCourse>>(initialResult);
  const [loading, setLoading] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Re-sync when the URL changes (nav click, Back/Forward, chip removal).
  const urlKey = searchParams.toString();
  const [lastUrlKey, setLastUrlKey] = useState(urlKey);
  if (lastUrlKey !== urlKey) {
    setLastUrlKey(urlKey);
    setFilters(readState());
    setPage(1);
  }

  // The server already rendered this exact request, so skip the first fetch.
  const servedKey = `${JSON.stringify(initialState)}|1`;
  const skipKeyRef = useRef<string | null>(servedKey);

  useEffect(() => {
    const key = `${JSON.stringify(filters)}|${page}`;
    if (skipKeyRef.current !== null && skipKeyRef.current === key) {
      skipKeyRef.current = null;
      return;
    }

    let active = true;
    async function load() {
      setLoading(true);
      try {
        const resolved = resolveCourseQuery(filters, options);
        // The URL carries friendly slugs; the DB stores the subject display name.
        const subjectName = resolved.field
          ? options.subjects.find((s) => s.id === resolved.field)?.name ?? resolved.field
          : undefined;
        const res = await fetchPublicCourses({
          degree: resolved.degree || undefined,
          subject: subjectName || undefined,
          country: resolved.country || undefined,
          region: resolved.region || undefined,
          university: resolved.university || undefined,
          studyMode: resolved.studyMode || undefined,
          duration: resolved.duration || undefined,
          tuitionFee: resolved.tuitionFee || undefined,
          courseType: resolved.courseType || undefined,
          page,
          limit: SCHOLARSHIP_PAGE_SIZE,
        });
        if (active) setResult(res);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [filters, page, options]);

  const pushState = (next: CourseFilterState) => {
    setFilters(next);
    setPage(1);
    const query = courseFiltersToQuery(next);
    router.push(`/course-search${query ? `?${query}` : ""}`);
  };

  const handleReset = () => pushState({ ...EMPTY_COURSE_FILTERS });

  const handleRemove = (key: FilterKey) => {
    pushState({ ...filters, [key]: "" });
  };

  // --- Active filter chips (labels resolved from the dynamic options). ---
  // Labels come from the resolved DB values, not the raw URL slug, so
  // "?subject=business" reads "Business Administration" and "?country=germany"
  // reads "Germany". A slug that resolves to nothing is simply not applied.
  const resolved = resolveCourseQuery(filters, options);
  const chips: { key: FilterKey; label: string }[] = [];
  if (resolved.degree) {
    const match = options.degrees.find((d) => d.value === resolved.degree);
    chips.push({ key: "degree", label: match?.label ?? resolved.degree });
  }
  if (resolved.field) {
    const match = options.subjects.find((s) => s.id === resolved.field);
    chips.push({ key: "subject", label: match?.name ?? resolved.field });
  }
  if (resolved.country) {
    const match = options.countries.find((c) => c.id === resolved.country);
    chips.push({ key: "country", label: match?.name ?? resolved.country });
  } else if (resolved.region) {
    chips.push({ key: "country", label: resolved.region });
  }
  if (resolved.university) {
    const uni = options.universities.find((u) => u.id === resolved.university);
    chips.push({ key: "university", label: uni?.name ?? resolved.university });
  }
  if (resolved.studyMode) {
    const match = options.studyModes.find((s) => s.value === resolved.studyMode);
    chips.push({ key: "studyMode", label: match?.label ?? resolved.studyMode });
  }
  if (resolved.duration) {
    const match = options.durations.find((d) => d.value === resolved.duration);
    chips.push({ key: "duration", label: match?.label ?? resolved.duration });
  }
  if (resolved.tuitionFee) {
    const match = options.tuitionFees.find((t) => t.value === resolved.tuitionFee);
    chips.push({ key: "tuitionFee", label: match?.label ?? resolved.tuitionFee });
  }
  if (resolved.courseType) {
    const match = options.courseTypes.find((c) => c.value === resolved.courseType);
    chips.push({ key: "courseType", label: match?.label ?? resolved.courseType });
  }

  const heading = chips.length
    ? `${chips.map((c) => c.label).join(" · ")} Courses`
    : "Explore Courses Worldwide";

  return (
    <div className="bg-secondary-50/50 min-h-screen py-8">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <nav
            className="flex items-center gap-1 text-xs text-secondary-500 mb-3"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="flex items-center gap-1 text-secondary-500 hover:text-secondary-900 transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <span className="text-secondary-400">/</span>
            <span className="text-secondary-900 font-medium">Course Search</span>
          </nav>
          <h1 className="text-2xl font-extrabold text-secondary-950 sm:text-3xl">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-secondary-600">
            Browse courses and programmes from accredited universities worldwide.
          </p>

          {chips.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-secondary-200 bg-white p-3 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
                Active filters
              </span>
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={() => handleRemove(chip.key)}
                    className="rounded-full p-0.5 text-primary-600 transition-colors hover:bg-primary-100 hover:text-primary-800"
                    aria-label={`Remove ${chip.label} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={handleReset}
                className="ml-auto text-xs font-semibold text-primary-600 underline underline-offset-4 transition-colors hover:text-primary-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Top bar: count + mobile filter toggle */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-secondary-200 bg-white p-4 shadow-card">
          <div className="flex items-center gap-2">
            <span className="font-bold text-secondary-900 text-sm">
              {result.total}
            </span>
            <span className="text-sm text-secondary-600">
              {result.total === 1 ? "course" : "courses"} found
            </span>
          </div>
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            aria-expanded={isMobileFilterOpen}
            aria-controls={isMobileFilterOpen ? "course-filters" : undefined}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-secondary-200 px-4 text-sm font-medium text-secondary-700 hover:bg-secondary-50 lg:hidden"
          >
            <Filter className="h-4 w-4" />
            Filters
            {isMobileFilterOpen && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-100 px-1.5 text-[10px] font-bold text-primary-700">
                ✕
              </span>
            )}
          </button>
        </div>

        {/* Filters + results */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="hidden lg:block lg:col-span-1">
            <CourseFilters
              filters={filters}
              options={options}
              onChange={pushState}
              onReset={handleReset}
            />
          </div>

          {isMobileFilterOpen && (
            <div id="course-filters" className="block lg:hidden mb-4">
              <CourseFilters
                filters={filters}
                options={options}
                onChange={(f) => {
                  pushState(f);
                  setIsMobileFilterOpen(false);
                }}
                onReset={() => {
                  handleReset();
                  setIsMobileFilterOpen(false);
                }}
              />
            </div>
          )}

          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-72 rounded-2xl bg-white border border-secondary-200 animate-pulse p-5"
                  />
                ))}
              </div>
            ) : result.data.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-secondary-300 bg-white p-16 text-center">
                <Inbox className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-base font-bold text-secondary-900 mb-2">
                  No courses available
                </h3>
                <p className="text-sm text-secondary-500 max-w-sm mx-auto mb-6">
                  We couldn&apos;t find any courses matching your filters. Try
                  broadening your criteria or resetting filters.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-secondary-200 bg-white px-5 py-2.5 text-sm font-semibold text-secondary-700 shadow-sm hover:bg-secondary-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset all filters
                  </button>
                  <Link
                    href="/course-search"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
                  >
                    Browse all courses
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {result.data.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {result.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-secondary-200 bg-white px-3 py-1.5 text-xs font-medium text-secondary-700 disabled:opacity-40 hover:bg-secondary-50"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-secondary-600 px-2">
                      Page {page} of {result.totalPages}
                    </span>
                    <button
                      disabled={page === result.totalPages}
                      onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
                      className="rounded-lg border border-secondary-200 bg-white px-3 py-1.5 text-xs font-medium text-secondary-700 disabled:opacity-40 hover:bg-secondary-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}