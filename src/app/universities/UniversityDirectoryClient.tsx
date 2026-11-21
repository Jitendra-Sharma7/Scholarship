"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DirectoryToolbar } from "@/components/public/DirectoryToolbar";
import { UniversityFilters } from "@/components/public/UniversityFilters";
import { ActiveFilterChips } from "@/components/public/ActiveFilterChips";
import { UniversityCard } from "@/components/public/UniversityCard";
import { UniversityListItem } from "@/components/public/UniversityListItem";
import { UniversityPagination } from "@/components/public/UniversityPagination";
import { DirectoryEmptyState } from "@/components/public/DirectoryEmptyState";
import { DirectoryLoadingSkeleton } from "@/components/public/DirectoryLoadingSkeleton";
import { fetchPublicUniversitiesPaginated } from "@/app/actions/public-actions";
import type { PaginatedUniversities } from "@/lib/data/public";
import type { PublicUniversity } from "@/lib/data/public";
import type { UniversityFilterOptions } from "@/lib/data/public";
import { UNIVERSITY_PAGE_SIZE } from "@/lib/page-size";
import { Button } from "@/components/ui/Button";

interface UniversityDirectoryClientProps {
  universities: PublicUniversity[];
  filterOptions: UniversityFilterOptions;
  totalUniversities: number;
  totalPages: number;
  currentPage: number;
  filters: {
    q: string;
    country: string;
    ranking: string;
    studyLevel: string;
    scholarships: string;
    field: string;
    type: string;
    intake: string;
    tuitionRange: string;
    sort: "ranking" | "lowest" | "name" | "scholarships" | "country";
    view: string;
  };
  error: Error | null;
}

const RANKING_LABELS: Record<string, string> = {
  top10: "Top 10",
  top50: "Top 50",
  top100: "Top 100",
  top500: "Top 500",
  unranked: "Unranked",
};

const TUITION_RANGE_LABELS: Record<string, string> = {
  free: "Free / No tuition",
  low: "Low (under $10k)",
  medium: "Moderate ($10k–$30k)",
  high: "High ($30k+)",
};

export function UniversityDirectoryClient({
  universities,
  filterOptions,
  totalUniversities,
  totalPages,
  currentPage,
  filters,
  error,
}: UniversityDirectoryClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [result, setResult] = useState<PaginatedUniversities | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    filters.view === "list" ? "list" : "grid"
  );

  const skipKeyRef = useRef<string | null>(null);

  // Build active filter chips
  const activeFilterChips = React.useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (filters.q) chips.push({ key: "q", label: `Search: "${filters.q}"` });
    if (filters.country !== "all") {
      const c = filterOptions.countries.find((co) => co.name === filters.country);
      if (c) chips.push({ key: "country", label: `Country: ${c.name}` });
    }
    if (filters.ranking !== "all")
      chips.push({ key: "ranking", label: `Ranking: ${RANKING_LABELS[filters.ranking] ?? filters.ranking}` });
    if (filters.studyLevel !== "all") {
      const s = filterOptions.studyLevels.find((sl) => sl.value === filters.studyLevel);
      if (s) chips.push({ key: "studyLevel", label: `Study level: ${s.label}` });
    }
    if (filters.scholarships !== "all")
      chips.push({
        key: "scholarships",
        label: `Scholarships: ${filters.scholarships === "with" ? "With scholarships" : "Without scholarships"}`,
      });
    if (filters.field !== "all") chips.push({ key: "field", label: `Subject: ${filters.field}` });
    if (filters.type !== "all") chips.push({ key: "type", label: `Type: ${filters.type}` });
    if (filters.intake !== "all") {
      const i = filterOptions.intakes.find((x) => x.slug === filters.intake);
      if (i) chips.push({ key: "intake", label: `Intake: ${i.name}` });
    }
    if (filters.tuitionRange !== "all")
      chips.push({
        key: "tuitionRange",
        label: `Tuition: ${TUITION_RANGE_LABELS[filters.tuitionRange] ?? filters.tuitionRange}`,
      });
    return chips;
  }, [filters, filterOptions]);

  const hasActiveFilters = activeFilterChips.length > 0;

  // Sync filters from URL changes
  const urlKey = searchParams.toString();
  const [lastUrlKey, setLastUrlKey] = useState(urlKey);
  if (lastUrlKey !== urlKey) {
    setLastUrlKey(urlKey);
    setViewMode(searchParams.get("view") === "list" ? "list" : "grid");
  }

  // Load results when filters or page change
  useEffect(() => {
    const key = `${JSON.stringify(filters)}|${currentPage}`;
    if (skipKeyRef.current !== null && skipKeyRef.current === key) {
      skipKeyRef.current = null;
      return;
    }

    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchPublicUniversitiesPaginated({
          query: filters.q || undefined,
          country: filters.country !== "all" ? filters.country : undefined,
          ranking: filters.ranking !== "all" ? filters.ranking : undefined,
          studyLevel: filters.studyLevel !== "all" ? filters.studyLevel : undefined,
          scholarships: filters.scholarships !== "all" ? filters.scholarships : undefined,
          field: filters.field !== "all" ? filters.field : undefined,
          type: filters.type !== "all" ? filters.type : undefined,
          intake: filters.intake !== "all" ? filters.intake : undefined,
          tuitionRange: filters.tuitionRange !== "all" ? filters.tuitionRange : undefined,
          sort: filters.sort,
          page: currentPage,
          limit: UNIVERSITY_PAGE_SIZE,
        });
        if (!active) return;
        setResult(res);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [filters, currentPage]);

  const navigate = (patch: Partial<typeof filters>, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    if (patch.q !== undefined) {
      if (patch.q) params.set("q", patch.q);
      else params.delete("q");
    }
    if (patch.country !== undefined) {
      if (patch.country !== "all") params.set("country", patch.country);
      else params.delete("country");
    }
    if (patch.ranking !== undefined) {
      if (patch.ranking !== "all") params.set("ranking", patch.ranking);
      else params.delete("ranking");
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
    if (patch.type !== undefined) {
      if (patch.type !== "all") params.set("type", patch.type);
      else params.delete("type");
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
    if (resetPage) params.delete("page");

    const qs = params.toString();
    router.push(`/universities?${qs}`, { scroll: false });
  };

  const handleFilterChange = (patch: Partial<typeof filters>) => {
    navigate(patch, true);
  };

  const handleClearAll = () => {
    navigate(
      {
        q: "",
        country: "all",
        ranking: "all",
        studyLevel: "all",
        scholarships: "all",
        field: "all",
        type: "all",
        intake: "all",
        tuitionRange: "all",
        sort: "ranking",
        view: "grid",
      },
      true
    );
  };

  const handleRemoveChip = (key: string) => {
    const patch: Partial<typeof filters> = {};
    if (key === "q") patch.q = "";
    else if (key === "country") patch.country = "all";
    else if (key === "ranking") patch.ranking = "all";
    else if (key === "studyLevel") patch.studyLevel = "all";
    else if (key === "scholarships") patch.scholarships = "all";
    else if (key === "field") patch.field = "all";
    else if (key === "type") patch.type = "all";
    else if (key === "intake") patch.intake = "all";
    else if (key === "tuitionRange") patch.tuitionRange = "all";
    handleFilterChange(patch);
  };

  const handleViewChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    navigate({ view: mode }, false);
  };

  const handleSortChange = (value: string) => {
    navigate({ sort: value as "ranking" | "lowest" | "name" | "scholarships" | "country" }, true);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/universities?${params.toString()}`, { scroll: false });
  };

  const dataToRender = result ?? {
    data: universities,
    total: totalUniversities,
    page: currentPage,
    totalPages,
    hasMore: currentPage < totalPages,
  };

  const visible = dataToRender.data;
  const showingFromCalc = visible.length > 0 ? (currentPage - 1) * UNIVERSITY_PAGE_SIZE + 1 : 0;
  const showingToCalc = Math.min(currentPage * UNIVERSITY_PAGE_SIZE, dataToRender.total);

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
        <h3 className="text-base font-semibold text-dark mb-1">
          We could not load the directory
        </h3>
        <p className="text-sm text-muted mb-6">
          Please try again. If the problem persists, contact support.
        </p>
        <Button onClick={() => window.location.reload()} size="sm">
          <ArrowRight className="h-3.5 w-3.5" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results toolbar */}
      <DirectoryToolbar
        totalCount={dataToRender.total}
        showingFrom={showingFromCalc}
        showingTo={showingToCalc}
        sort={filters.sort}
        view={viewMode}
        onSortChange={handleSortChange}
        onViewChange={handleViewChange}
      />

      {/* Active filter chips */}
      {hasActiveFilters && (
        <ActiveFilterChips
          chips={activeFilterChips}
          onRemove={handleRemoveChip}
          onClearAll={handleClearAll}
        />
      )}

      {/* Filter panel */}
      <UniversityFilters
        countries={filterOptions.countries}
        types={filterOptions.types}
        fields={filterOptions.fields}
        intakes={filterOptions.intakes}
        studyLevels={filterOptions.studyLevels}
        values={{
          country: filters.country,
          ranking: filters.ranking,
          studyLevel: filters.studyLevel,
          scholarships: filters.scholarships,
          field: filters.field,
          type: filters.type,
          intake: filters.intake,
          tuitionRange: filters.tuitionRange,
        }}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Results */}
      {loading ? (
        <DirectoryLoadingSkeleton count={9} view={viewMode} />
      ) : visible.length === 0 ? (
        <DirectoryEmptyState
          onResetFilters={handleClearAll}
          hasActiveFilters={hasActiveFilters}
        />
      ) : (
        <>
          <div className="transition-opacity duration-200">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visible.map((u) => (
                  <UniversityCard key={u.id} university={u} priority={u.id === visible[0]?.id} />
                ))}
              </div>
            ) : (
              <div className="space-y-0">
                {visible.map((u) => (
                  <UniversityListItem key={u.id} university={u} />
                ))}
              </div>
            )}
          </div>

          <UniversityPagination
            page={currentPage}
            totalPages={dataToRender.totalPages}
            totalItems={dataToRender.total}
            itemsPerPage={UNIVERSITY_PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
