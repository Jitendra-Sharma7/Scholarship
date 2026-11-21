"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LayoutGrid, LayoutList, Filter, RotateCcw, ChevronDown } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { DirectoryHero } from "@/components/directory/DirectoryHero";
import { DirectorySearchBar } from "@/components/directory/DirectorySearchBar";
import { HorizontalFilterBar } from "@/components/directory/HorizontalFilterBar";
import { FilterSidebar } from "@/components/directory/FilterSidebar";
import { DirectoryScholarshipCard } from "@/components/directory/DirectoryScholarshipCard";
import { DirectoryPagination } from "@/components/directory/DirectoryPagination";
import { fetchPublicScholarships, fetchPublicIntakes } from "@/app/actions/public-actions";
import type { Paginated, PublicCountryOption, PublicField, PublicScholarship } from "@/lib/data/public";
import { SCHOLARSHIP_PAGE_SIZE } from "@/lib/page-size";
import { cn } from "@/lib/utils";

export function DirectoryBrowser({
  countries,
  fields,
  intakes,
  initialResult,
}: {
  countries: PublicCountryOption[];
  fields: PublicField[];
  intakes: { id: string; name: string; slug: string }[];
  initialResult: Paginated<PublicScholarship>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filter state
  const [filters, setFilters] = useState({
    query: searchParams.get("query") || "",
    country: searchParams.get("country") || "",
    field: searchParams.get("field") || "",
    degree: searchParams.get("degree") || "",
    funding: searchParams.get("funding") || "",
    intake: searchParams.get("intake") || "",
    status: searchParams.get("status") || "",
    eligibleNationality: searchParams.get("eligibleNationality") || "",
    applicationFee: searchParams.get("applicationFee") || "",
    sortBy: searchParams.get("sortBy") || "relevance",
  });

  // Horizontal filter bar state
  const [horizontalFilters, setHorizontalFilters] = useState({
    country: "",
    studyLevel: "",
    fundingType: "",
    fieldOfStudy: "",
    intake: "",
    deadline: "",
  });

  // Sidebar filter state
  const [sidebarFilters, setSidebarFilters] = useState({
    scholarshipType: [] as string[],
    country: [] as string[],
    studyLevel: [] as string[],
    deadline: [] as string[],
    fieldOfStudy: [] as string[],
    fundingAmount: [] as string[],
    university: [] as string[],
    provider: [] as string[],
  });

  const [sortOption, setSortOption] = useState("relevance");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [result, setResult] = useState<Paginated<PublicScholarship>>(initialResult);
  const [loading, setLoading] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Scholarship counts for sidebar
  const [scholarshipCounts, setScholarshipCounts] = useState({
    scholarshipType: { "fully-funded": 120, "partial-funding": 340, "tuition-discount": 210 },
    country: {} as Record<string, number>,
    studyLevel: { "Undergraduate": 210, "Master's": 320, "PhD": 120 },
    deadline: { "next-3-months": 250, "next-6-months": 420, "next-year": 680 },
  });

  // Build active filter chips
  const activeFilterChips = React.useMemo(() => {
    const chips: Array<{ key: string; label: string; value: string }> = [];
    
    if (filters.country) {
      const c = countries.find((co) => co.id === filters.country);
      if (c) chips.push({ key: "country", label: c.name, value: filters.country });
    }
    if (filters.degree) chips.push({ key: "degree", label: filters.degree, value: filters.degree });
    if (filters.funding) chips.push({ key: "funding", label: filters.funding, value: filters.funding });
    if (filters.field) {
      const f = fields.find((fi) => fi.id === filters.field);
      if (f) chips.push({ key: "field", label: f.name, value: filters.field });
    }
    if (filters.intake) chips.push({ key: "intake", label: filters.intake, value: filters.intake });
    if (filters.status) chips.push({ key: "status", label: filters.status, value: filters.status });
    
    return chips;
  }, [filters, countries, fields]);

  const hasActiveFilters = activeFilterChips.length > 0;

  // Sync filters from URL
  const urlKey = searchParams.toString();
  const [lastUrlKey, setLastUrlKey] = useState(urlKey);
  if (lastUrlKey !== urlKey) {
    setLastUrlKey(urlKey);
    setFilters({
      query: searchParams.get("query") || "",
      country: searchParams.get("country") || "",
      field: searchParams.get("field") || "",
      degree: searchParams.get("degree") || "",
      funding: searchParams.get("funding") || "",
      intake: searchParams.get("intake") || "",
      status: searchParams.get("status") || "",
      eligibleNationality: searchParams.get("eligibleNationality") || "",
      applicationFee: searchParams.get("applicationFee") || "",
      sortBy: searchParams.get("sortBy") || "relevance",
    });
    setPage(1);
  }

  // Skip initial fetch since server already rendered
  const servedKey = `${JSON.stringify(filters)}|${page}|${sortOption}`;
  const skipKeyRef = useRef<string | null>(servedKey);

  // Load results when filters or page change
  useEffect(() => {
    const key = `${JSON.stringify(filters)}|${page}|${sortOption}`;
    if (skipKeyRef.current !== null && skipKeyRef.current === key) {
      skipKeyRef.current = null;
      return;
    }

    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchPublicScholarships({
          ...filters,
          page,
          limit: SCHOLARSHIP_PAGE_SIZE,
        });
        if (!active) return;

        // Apply client sort if needed
        const sorted = [...res.data];
        if (sortOption === "deadline") {
          sorted.sort((a, b) => {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          });
        } else if (sortOption === "alphabetical") {
          sorted.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortOption === "newest") {
          sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortOption === "amount") {
          sorted.sort((a, b) => (b.fundingAmount || 0) - (a.fundingAmount || 0));
        } else if (sortOption === "fully-funded") {
          sorted.sort((a, b) => (b.isFullyFunded ? 1 : 0) - (a.isFullyFunded ? 1 : 0));
        }

        setResult({
          ...res,
          data: sorted,
        });
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [filters, page, sortOption]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
    const params = new URLSearchParams();
    if (newFilters.query) params.set("query", newFilters.query);
    if (newFilters.country) params.set("country", newFilters.country);
    if (newFilters.field) params.set("field", newFilters.field);
    if (newFilters.degree) params.set("degree", newFilters.degree);
    if (newFilters.funding) params.set("funding", newFilters.funding);
    if (newFilters.intake) params.set("intake", newFilters.intake);
    if (newFilters.status) params.set("status", newFilters.status);
    if (newFilters.eligibleNationality) params.set("eligibleNationality", newFilters.eligibleNationality);
    if (newFilters.applicationFee) params.set("applicationFee", newFilters.applicationFee);
    if (newFilters.sortBy) params.set("sortBy", newFilters.sortBy);
    router.push(`/directory?${params.toString()}`);
  };

  const handleResetFilters = () => {
    const empty = { 
      query: "", 
      country: "", 
      field: "", 
      degree: "", 
      funding: "", 
      intake: "",
      status: "",
      eligibleNationality: "",
      applicationFee: "",
      sortBy: "relevance"
    };
    handleFilterChange(empty);
    setHorizontalFilters({
      country: "",
      studyLevel: "",
      fundingType: "",
      fieldOfStudy: "",
      intake: "",
      deadline: "",
    });
    setSidebarFilters({
      scholarshipType: [],
      country: [],
      studyLevel: [],
      deadline: [],
      fieldOfStudy: [],
      fundingAmount: [],
      university: [],
      provider: [],
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange(filters);
  };

  const handleHorizontalFilterChange = (newFilters: typeof horizontalFilters) => {
    setHorizontalFilters(newFilters);
    const mappedFilters = {
      ...filters,
      country: newFilters.country || filters.country,
      degree: newFilters.studyLevel || filters.degree,
      funding: newFilters.fundingType || filters.funding,
      field: newFilters.fieldOfStudy || filters.field,
      intake: newFilters.intake || filters.intake,
    };
    handleFilterChange(mappedFilters);
  };

  const handleRemoveChip = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (key === "country") newFilters.country = "";
    else if (key === "degree") newFilters.degree = "";
    else if (key === "funding") newFilters.funding = "";
    else if (key === "field") newFilters.field = "";
    else if (key === "intake") newFilters.intake = "";
    else if (key === "status") newFilters.status = "";
    handleFilterChange(newFilters);
  };

  const handleClearAllChips = () => {
    handleResetFilters();
  };

  const handleViewChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.push(`/directory?${params.toString()}`);
  };

  const handleSidebarChange = (newFilters: typeof sidebarFilters) => {
    setSidebarFilters(newFilters);
  };

  return (
    <div className="bg-secondary-50/50 min-h-screen">
      {/* Hero Section */}
      <DirectoryHero />

      {/* Search & Filter Section */}
      <section className="relative -mt-6 z-10">
        <Container>
          <div className="bg-white rounded-2xl border border-secondary-200 shadow-sm p-5 sm:p-6 lg:p-8">
            {/* Search Bar */}
            <DirectorySearchBar
              value={filters.query}
              onChange={(value) => setFilters({ ...filters, query: value })}
              onSubmit={handleSearchSubmit}
              onClear={() => setFilters({ ...filters, query: "" })}
              hasActiveFilters={hasActiveFilters}
              onFilterClick={() => setIsMobileFilterOpen(true)}
              isMobileFilterOpen={isMobileFilterOpen}
            />

            {/* Horizontal Filter Bar */}
            <HorizontalFilterBar
              filters={horizontalFilters}
              onChange={handleHorizontalFilterChange}
              onClearAll={handleClearAllChips}
              countries={countries}
              fields={fields}
              activeFilterChips={activeFilterChips}
              onRemoveChip={handleRemoveChip}
            />
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Left Sidebar Filters */}
            <FilterSidebar
              filters={sidebarFilters}
              onChange={handleSidebarChange}
              onReset={handleResetFilters}
              countries={countries}
              fields={fields}
              scholarshipCounts={scholarshipCounts}
            />

            {/* Mobile Filter Drawer */}
            {isMobileFilterOpen && (
              <FilterSidebar
                filters={sidebarFilters}
                onChange={(f) => {
                  handleSidebarChange(f);
                  setIsMobileFilterOpen(false);
                }}
                onReset={() => {
                  handleResetFilters();
                  setIsMobileFilterOpen(false);
                }}
                countries={countries}
                fields={fields}
                scholarshipCounts={scholarshipCounts}
                isMobile={true}
                onClose={() => setIsMobileFilterOpen(false)}
              />
            )}

            {/* Right Results */}
            <div className="lg:col-span-3">
              {/* Results Header */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-secondary-200 bg-white p-4 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-secondary-900 text-sm">{result.total}</span>
                  <span className="text-sm text-secondary-600">scholarships found</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Mobile Filter Toggle */}
                  <button
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    aria-expanded={isMobileFilterOpen}
                    className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-secondary-200 px-4 text-sm font-medium text-secondary-700 hover:bg-secondary-50 lg:hidden"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-100 px-1.5 text-[10px] font-bold text-primary-700">✕</span>
                    )}
                  </button>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 text-xs hidden sm:flex">
                    <span className="text-secondary-500 font-medium">View:</span>
                    <div className="inline-flex rounded-lg border border-secondary-200 bg-white shadow-sm">
                      <button
                        type="button"
                        onClick={() => handleViewChange("grid")}
                        aria-label="Grid view"
                        className={`p-2 text-sm transition-colors ${viewMode === "grid" ? "bg-primary-600 text-white" : "text-secondary-600 hover:bg-secondary-50"}`}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewChange("list")}
                        aria-label="List view"
                        className={`p-2 text-sm transition-colors ${viewMode === "list" ? "bg-primary-600 text-white" : "text-secondary-600 hover:bg-secondary-50"}`}
                      >
                        <LayoutList className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2 text-xs">
                    <label htmlFor="directory-sort" className="text-secondary-500 font-medium">
                      Sort by:
                    </label>
                    <select
                      id="directory-sort"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="rounded-lg border border-secondary-200 bg-secondary-50/50 py-1.5 px-2.5 text-xs font-medium text-secondary-800 focus:border-primary-500 focus:outline-none"
                    >
                      <option value="relevance">Most Relevant</option>
                      <option value="deadline">Upcoming Deadline</option>
                      <option value="newest">Latest</option>
                      <option value="alphabetical">Alphabetical (A-Z)</option>
                      <option value="amount">Highest Funding</option>
                      <option value="fully-funded">Fully Funded First</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Results List */}
              {loading ? (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-2xl bg-white border border-secondary-200 animate-pulse",
                        viewMode === "grid" ? "h-72" : "h-40"
                      )}
                    />
                  ))}
                </div>
              ) : result.data.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-secondary-300 bg-white p-12 text-center">
                  <svg className="h-12 w-12 text-secondary-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-base font-bold text-secondary-900">No scholarships found</h3>
                  <p className="mt-1 text-sm text-secondary-500 max-w-sm mx-auto">
                    We couldn&apos;t find any opportunities matching your active filters. Try broadening your criteria or resetting filters.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset all filters
                  </button>
                </div>
              ) : (
                <>
                  <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}>
                    {result.data.map((sch) => (
                      <DirectoryScholarshipCard key={sch.id} scholarship={sch} viewMode={viewMode} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {result.totalPages > 1 && (
                    <DirectoryPagination
                      currentPage={page}
                      totalPages={result.totalPages}
                      totalItems={result.total}
                      itemsPerPage={SCHOLARSHIP_PAGE_SIZE}
                      onPageChange={setPage}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}