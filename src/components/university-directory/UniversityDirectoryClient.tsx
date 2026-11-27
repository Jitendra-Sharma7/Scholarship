"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { FiltersSidebar } from "@/components/university-directory/FiltersSidebar";
import { ResultsBar } from "@/components/university-directory/ResultsBar";
import { UniversityCard } from "@/components/university-directory/UniversityCard";
import { UniversityListItem } from "@/components/university-directory/UniversityListItem";
import { DirectoryEmptyState } from "@/components/university-directory/DirectoryEmptyState";
import { DirectoryLoadingSkeleton } from "@/components/university-directory/DirectoryLoadingSkeleton";
import { DirectoryErrorState } from "@/components/university-directory/DirectoryErrorState";
import { fetchPublicUniversitiesPaginated } from "@/app/actions/public-actions";
import type { PaginatedUniversities } from "@/lib/data/public";
import type { PublicUniversity } from "@/lib/data/public";
import type { UniversityFilterOptions } from "@/lib/data/public";
import { UNIVERSITY_PAGE_SIZE } from "@/lib/page-size";
import { cn } from "@/lib/utils";

interface UniversityDirectoryClientProps {
  universities: PublicUniversity[];
  filterOptions: UniversityFilterOptions;
  totalUniversities: number;
  totalPages: number;
  currentPage: number;
  filters: {
    q: string;
    country: string;
    city: string;
    studyLevel: string;
    scholarships: string;
    field: string;
    intake: string;
    tuitionRange: string;
    sort: string;
    view: string;
    category: string;
  };
  error: Error | null;
}

type SortValue = "ranking" | "lowest" | "name" | "scholarships";

const DEFAULT_STATE = {
  country: "all",
  city: "all",
  studyLevel: "all",
  scholarships: "all",
  field: "all",
  intake: "all",
  tuitionRange: "all",
  q: "",
  sort: "ranking" as SortValue,
  view: "grid" as const,
  category: "all" as const,
  page: 1,
};

type Category = "all" | "popular" | "top-ranked" | "scholarships";

export function UniversityDirectoryClient({
  universities: initialUniversities,
  filterOptions,
  totalUniversities,
  totalPages: initialTotalPages,
  currentPage: initialPage,
  filters: initialFilters,
  error,
}: UniversityDirectoryClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);

  const state = useMemo(
    () => ({
      ...DEFAULT_STATE,
      country: initialFilters.country,
      city: initialFilters.city,
      studyLevel: initialFilters.studyLevel,
      scholarships: initialFilters.scholarships,
      field: initialFilters.field,
      intake: initialFilters.intake,
      tuitionRange: initialFilters.tuitionRange,
      q: initialFilters.q,
      sort: (initialFilters.sort === "ranking" ||
      initialFilters.sort === "name" ||
      initialFilters.sort === "scholarships" ||
      initialFilters.sort === "lowest"
        ? initialFilters.sort
        : DEFAULT_STATE.sort) as typeof DEFAULT_STATE.sort,
      view: (initialFilters.view === "list" ? "list" : "grid") as
        | "grid"
        | "list",
      category: (["all", "popular", "top-ranked", "scholarships"].includes(
        initialFilters.category,
      )
        ? initialFilters.category
        : DEFAULT_STATE.category) as Category,
      page: Math.max(Math.trunc(initialPage), 1),
    }),
    [initialFilters, initialPage],
  );

  const [result, setResult] = useState<PaginatedUniversities | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";

  const navigate = useCallback(
    (patch: Partial<typeof state>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      if (patch.q !== undefined) {
        if (patch.q) params.set("q", patch.q);
        else params.delete("q");
      }
      if (patch.country !== undefined) {
        if (patch.country !== "all") params.set("country", patch.country);
        else params.delete("country");
      }
      if (patch.city !== undefined) {
        if (patch.city !== "all") params.set("city", patch.city);
        else params.delete("city");
      }
      if (patch.studyLevel !== undefined) {
        if (patch.studyLevel !== "all") params.set("studyLevel", patch.studyLevel);
        else params.delete("studyLevel");
      }
      if (patch.scholarships !== undefined) {
        if (patch.scholarships !== "all") params.set("scholarships", patch.scholarships);
        else params.delete("scholarships");
      }
      if (patch.field !== undefined) {
        if (patch.field !== "all") params.set("field", patch.field);
        else params.delete("field");
      }
      if (patch.intake !== undefined) {
        if (patch.intake !== "all") params.set("intake", patch.intake);
        else params.delete("intake");
      }
      if (patch.tuitionRange !== undefined) {
        if (patch.tuitionRange !== "all") params.set("tuitionRange", patch.tuitionRange);
        else params.delete("tuitionRange");
      }
      if (patch.sort !== undefined) {
        if (patch.sort !== "ranking") params.set("sort", patch.sort);
        else params.delete("sort");
      }
      if (patch.view !== undefined) {
        if (patch.view !== "grid") params.set("view", patch.view);
        else params.delete("view");
      }
      if (patch.category !== undefined) {
        if (patch.category !== "all") params.set("category", patch.category);
        else params.delete("category");
      }
      if (patch.page !== undefined) {
        params.set("page", String(patch.page));
      } else if (resetPage) {
        params.delete("page");
      }

      const qs = params.toString();
      router.replace(`/universities?${qs}`, { scroll: false });
    },
    [searchParams, router],
  );

  const handleFilterChange = (patch: Partial<typeof state>) => {
    navigate(patch, true);
  };

  const handleClearAll = () => {
    navigate(DEFAULT_STATE, true);
  };

  const handleSortChange = (value: string) => {
    navigate({ sort: value as typeof state.sort }, true);
  };

  const handleViewChange = (mode: "grid" | "list") => {
    navigate({ view: mode }, false);
  };

  const handleCategoryChange = (category: string) => {
    const cat = ["all", "popular", "top-ranked", "scholarships"].includes(category)
      ? (category as Category)
      : "all";
    const sortMap: Record<Category, SortValue> = {
      all: "ranking",
      popular: "scholarships",
      "top-ranked": "ranking",
      scholarships: "scholarships",
    };
    navigate({ category: cat, sort: sortMap[cat] }, true);
  };

  const handlePageChange = (page: number) => {
    navigate({ page }, false);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetchPublicUniversitiesPaginated({
        query: state.q || undefined,
        country: state.country !== "all" ? state.country : undefined,
        city: state.city !== "all" ? state.city : undefined,
        studyLevel: state.studyLevel !== "all" ? state.studyLevel : undefined,
        scholarships: state.scholarships !== "all" ? state.scholarships : undefined,
        field: state.field !== "all" ? state.field : undefined,
        intake: state.intake !== "all" ? state.intake : undefined,
        tuitionRange: state.tuitionRange !== "all" ? state.tuitionRange : undefined,
        sort: state.sort,
        page: state.page,
        limit: UNIVERSITY_PAGE_SIZE,
      });
      setResult(res);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to load universities");
      setFetchError(error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => {
    let _active = true;
    (async () => {
      await load();
    })();
    return () => {
      _active = false;
    };
  }, [load]);

  const hasActiveFilters =
    state.q !== "" ||
    state.country !== "all" ||
    state.city !== "all" ||
    state.studyLevel !== "all" ||
    state.scholarships !== "all" ||
    state.field !== "all" ||
    state.intake !== "all" ||
    state.tuitionRange !== "all";

  const dataToRender = useMemo(
    () =>
      result ?? {
        data: initialUniversities,
        total: totalUniversities,
        page: state.page,
        totalPages: initialTotalPages,
        hasMore: state.page < initialTotalPages,
      },
    [result, initialUniversities, totalUniversities, initialTotalPages, state.page],
  );

  const visible = dataToRender.data;
  const totalPages = dataToRender.totalPages;
  const safePage = Math.min(Math.max(state.page, 1), totalPages);
  const start = (safePage - 1) * UNIVERSITY_PAGE_SIZE;
  const showingFrom = visible.length > 0 ? start + 1 : 0;
  const showingTo = Math.min(safePage * UNIVERSITY_PAGE_SIZE, dataToRender.total);

  const filteredCount = visible.length;

  // Build visible page numbers (max 5 around current)
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let left = Math.max(safePage - Math.floor(maxVisible / 2), 1);
    const right = Math.min(left + maxVisible - 1, totalPages);
    left = Math.max(right - maxVisible + 1, 1);
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  if (error || fetchError) {
    return (
      <DirectoryErrorState
        onRetry={() => {
          setFetchError(null);
          void load();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="lg:flex lg:items-start lg:gap-[28px]">
        <aside
          className="hidden shrink-0 w-[268px] [@media(min-width:900px)]:sticky [@media(min-width:900px)]:top-[80px] [@media(min-width:900px)]:flex"
        >
          <FiltersSidebar
            countries={filterOptions.countries}
            fields={filterOptions.fields}
            intakes={filterOptions.intakes}
            studyLevels={filterOptions.studyLevels}
            cities={filterOptions.cities}
            values={{
              country: state.country,
              city: state.city,
              studyLevel: state.studyLevel,
              scholarships: state.scholarships,
              field: state.field,
              intake: state.intake,
              tuitionRange: state.tuitionRange,
            }}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
            hasActiveFilters={hasActiveFilters}
            mobileOpen={mobileOpen}
            onToggleMobile={() => setMobileOpen((o) => !o)}
          />
        </aside>

        <div className="flex-1 min-w-0">
          <ResultsBar
            totalCount={dataToRender.total}
            showingFrom={showingFrom}
            showingTo={showingTo}
            sort={state.sort}
            view={viewMode}
            onSortChange={handleSortChange}
            onViewChange={handleViewChange}
            onFilterToggle={() => setMobileOpen((o) => !o)}
            activeFilterCount={
              (state.country !== "all" ? 1 : 0) +
              (state.city !== "all" ? 1 : 0) +
              (state.studyLevel !== "all" ? 1 : 0) +
              (state.scholarships !== "all" ? 1 : 0) +
              (state.field !== "all" ? 1 : 0) +
              (state.intake !== "all" ? 1 : 0) +
              (state.tuitionRange !== "all" ? 1 : 0) +
              (state.q !== "" ? 1 : 0)
            }
            onCategoryChange={handleCategoryChange}
            activeCategory={state.category}
          />

          {loading ? (
            <DirectoryLoadingSkeleton count={6} view={viewMode} />
          ) : filteredCount === 0 ? (
            <DirectoryEmptyState
              onResetFilters={handleClearAll}
              hasActiveFilters={hasActiveFilters}
            />
          ) : (
            <>
              <div className="transition-opacity duration-200">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[22px]">
                    {visible.map((u) => (
                      <UniversityCard key={u.id} university={u} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visible.map((u) => (
                      <UniversityListItem key={u.id} university={u} />
                    ))}
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-[#64748B]">
                    <span className="font-medium text-[#15264A]">
                      Page {safePage} of {totalPages}
                    </span>{" "}
                    <span className="text-[12px]">
                      · {dataToRender.total.toLocaleString()} universities
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => handlePageChange(safePage - 1)}
                      aria-label="Previous page"
                      className="rounded-[10px] border border-[#E2E8F0] bg-[#FFFFFF] px-3 py-2 text-sm text-[#15264A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F3F7FF] focus:outline-none focus:ring-2 focus:ring-[#1747D1] focus:ring-offset-2 focus:ring-offset-[#F3F7FF]"
                    >
                      <ChevronDown className="h-4 w-4 rotate-180" />
                    </button>
                    {pageNumbers.map((p) => (
                      <button
                        key={p}
                        type="button"
                        disabled={p === safePage}
                        onClick={() => handlePageChange(p)}
                        className={cn(
                          "rounded-[10px] px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#F3F7FF]",
                          p === safePage
                            ? "bg-[#1747D1] text-[#FFFFFF] shadow-sm"
                            : "text-[#15264A] hover:bg-[#F3F7FF] border border-transparent",
                        )}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => handlePageChange(safePage + 1)}
                      aria-label="Next page"
                      className="rounded-[10px] border border-[#E2E8F0] bg-[#FFFFFF] px-3 py-2 text-sm text-[#15264A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F3F7FF] focus:outline-none focus:ring-2 focus:ring-[#1747D1] focus:ring-offset-2 focus:ring-offset-[#F3F7FF]"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
