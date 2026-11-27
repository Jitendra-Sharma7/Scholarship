"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Inbox, RotateCcw, LayoutGrid, LayoutList, Filter, ChevronLeft, Home, X } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import { SearchFilters } from "@/components/scholarships/SearchFilters";
import { fetchPublicScholarships } from "@/app/actions/public-actions";
import type {
  Paginated,
  PublicCountryOption,
  PublicField,
  PublicScholarship,
  PublicUniversity,
} from "@/lib/data/public";

import { SCHOLARSHIP_PAGE_SIZE } from "@/lib/page-size";

interface FieldContext {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface FilterState {
  query: string;
  country: string;
  field: string;
  degree: string;
  funding: string;
  intake: string;
  status: string;
  eligibleNationality: string;
  applicationFee: string;
  university: string;
  sortBy: string;
}

type FilterKey = Exclude<keyof FilterState, "sortBy">;

const DEGREE_LABELS: Record<string, string> = {
  Undergraduate: "Bachelor's",
  "Master's": "Master's",
  PhD: "Ph.D.",
  Postdoctoral: "Postdoctoral",
  Research: "Research",
};

const FUNDING_LABELS: Record<string, string> = {
  "fully-funded": "Fully Funded",
  "fully-tuition": "Full Tuition",
  "partial-tuition": "Partially Funded",
  stipend: "Stipend",
  mixed: "Mixed Funding",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  upcoming: "Upcoming",
  "closing-soon": "Closing Soon",
  closed: "Closed",
  expired: "Expired",
};

const NATIONALITY_LABELS: Record<string, string> = {
  international: "Open to International",
  specific: "Specific Countries Only",
};

const APPLICATION_FEE_LABELS: Record<string, string> = {
  free: "Free Application",
  paid: "Paid Application",
};

/**
 * The browsing UI. Filter options and the first page of results arrive from the
 * server page as props, so the served HTML already contains real records; later
 * pages and filter changes are requested through a server action rather than a
 * public JSON route, so the browser holds no API surface of its own.
 */
export function ScholarshipsBrowser({
  countries,
  fields,
  universities,
  intakes,
  contextField,
  initialResult,
}: {
  countries: PublicCountryOption[];
  fields: PublicField[];
  universities: PublicUniversity[];
  intakes: { id: string; name: string; slug: string }[];
  contextField: FieldContext | null;
  initialResult: Paginated<PublicScholarship>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const firstParam = (key: string): string => {
    const value = searchParams.get(key);
    return value ?? "";
  };

  // Filter state seeded from the URL so direct links and browser Back/Forward
  // restore the exact filtered view.
  const [filters, setFilters] = useState<FilterState>({
    query: firstParam("query"),
    country: firstParam("country"),
    field: firstParam("field"),
    degree: firstParam("degree"),
    funding: firstParam("funding"),
    intake: firstParam("intake"),
    status: firstParam("status"),
    eligibleNationality: firstParam("eligibleNationality"),
    applicationFee: firstParam("applicationFee"),
    university: firstParam("university"),
    sortBy: firstParam("sort") || firstParam("sortBy") || "relevance",
  });

  const sortOption = filters.sortBy;
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  // Seeded from the server render, so the first paint is the real result set
  // rather than a skeleton and the result count is in the HTML.
  const [result, setResult] = useState<Paginated<PublicScholarship>>(initialResult);
  const [loading, setLoading] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Re-sync filters when the URL changes (e.g. a country tile links in with
  // ?country=de).
  const urlKey = searchParams.toString();
  const [lastUrlKey, setLastUrlKey] = useState(urlKey);
  if (lastUrlKey !== urlKey) {
    setLastUrlKey(urlKey);
    setFilters({
      query: firstParam("query"),
      country: firstParam("country"),
      field: firstParam("field"),
      degree: firstParam("degree"),
      funding: firstParam("funding"),
      intake: firstParam("intake"),
      status: firstParam("status"),
      eligibleNationality: firstParam("eligibleNationality"),
      applicationFee: firstParam("applicationFee"),
      university: firstParam("university"),
      sortBy: firstParam("sort") || firstParam("sortBy") || "relevance",
    });
    setPage(1);
  }

  // The server already rendered this exact request, so the first effect run has
  // nothing to fetch. Cleared on first use, so returning to the same filters
  // later refetches instead of showing a stale list.
  const servedKey = `${JSON.stringify(filters)}|${page}|${sortOption}`;
  const skipKeyRef = useRef<string | null>(servedKey);

  // Load the current result page when filters or page change
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
          sort: filters.sortBy as
            | "deadline"
            | "newest"
            | "title"
            | "featured"
            | "alphabetical"
            | "amount"
            | "fully-funded"
            | undefined,
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
        } else if (sortOption === "recently-updated") {
          sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
    // Update URL params
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
    if (newFilters.university) params.set("university", newFilters.university);
    if (newFilters.sortBy) params.set("sort", newFilters.sortBy);
    router.push(`/scholarships?${params.toString()}`);
  };

  const handleResetFilters = () => {
    const empty: FilterState = {
      query: "",
      country: "",
      field: "",
      degree: "",
      funding: "",
      intake: "",
      status: "",
      eligibleNationality: "",
      applicationFee: "",
      university: "",
      sortBy: "relevance",
    };
    handleFilterChange(empty);
  };

  const handleViewChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.push(`/scholarships?${params.toString()}`);
  };

  const fieldName = contextField?.name;
  const fieldDescription = contextField?.description;
  const countryName = countries.find((country) => country.id === filters.country)?.name;
  const universityName = universities.find((university) => university.id === filters.university)?.name;
  const intakeName = intakes.find((intake) => intake.slug === filters.intake)?.name;

  const activeCategoryLabel = filters.degree
    ? `${DEGREE_LABELS[filters.degree] ?? filters.degree} Scholarships`
    : filters.country
      ? `${countryName ?? filters.country} Scholarships`
      : filters.funding
        ? `${FUNDING_LABELS[filters.funding] ?? filters.funding} Scholarships`
        : null;

  const activeChips: { key: FilterKey; label: string }[] = [];
  if (filters.query) activeChips.push({ key: "query", label: `Search: ${filters.query}` });
  if (filters.degree) activeChips.push({ key: "degree", label: DEGREE_LABELS[filters.degree] ?? filters.degree });
  if (filters.country) activeChips.push({ key: "country", label: countryName ?? filters.country });
  if (filters.field) activeChips.push({ key: "field", label: fields.find((field) => field.id === filters.field)?.name ?? filters.field });
  if (filters.funding) activeChips.push({ key: "funding", label: FUNDING_LABELS[filters.funding] ?? filters.funding });
  if (filters.intake) activeChips.push({ key: "intake", label: intakeName ?? filters.intake });
  if (filters.status) activeChips.push({ key: "status", label: STATUS_LABELS[filters.status] ?? filters.status });
  if (filters.eligibleNationality) {
    activeChips.push({ key: "eligibleNationality", label: NATIONALITY_LABELS[filters.eligibleNationality] ?? filters.eligibleNationality });
  }
  if (filters.applicationFee) {
    activeChips.push({ key: "applicationFee", label: APPLICATION_FEE_LABELS[filters.applicationFee] ?? filters.applicationFee });
  }
  if (filters.university) activeChips.push({ key: "university", label: universityName ?? filters.university });

  const handleRemoveFilter = (key: FilterKey) => {
    const next: FilterState = { ...filters, [key]: "" };
    handleFilterChange(next);
  };

  return (
    <div className="bg-secondary-50/50 min-h-screen py-8">
      <Container>
        {/* Page Header */}
        <div className="mb-8">
          {contextField ? (
            <>
              <nav className="flex items-center gap-1 text-xs text-secondary-500 mb-3" aria-label="Breadcrumb">
                <Link
                  href="/"
                  className="flex items-center gap-1 text-secondary-500 hover:text-secondary-900 transition-colors"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>Home</span>
                </Link>
                <span className="text-secondary-400">/</span>
                <Link
                  href="/fields"
                  className="text-secondary-500 hover:text-secondary-900 transition-colors"
                >
                  Fields of Study
                </Link>
                <span className="text-secondary-400">/</span>
                <span className="text-secondary-900 font-medium">{fieldName}</span>
              </nav>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 border border-primary-100 mb-4">
                <span>{contextField.category ?? "Academic Discipline"}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-secondary-950 tracking-tight mb-2">
                {fieldName} Scholarships
              </h1>
              <p className="text-sm text-secondary-600 max-w-2xl mb-6">
                {fieldDescription ? (
                  fieldDescription
                ) : (
                  `Explore scholarship opportunities for students pursuing ${fieldName} and related disciplines.`
                )}
              </p>
              <div className="flex items-center gap-3">
                <span className="font-bold text-secondary-900 text-sm">{result.total}</span>
                <span className="text-sm text-secondary-600">
                  {result.total === 1 ? "scholarship" : "scholarships"} found
                </span>
                <Link
                  href="/fields"
                  className="ml-auto flex items-center gap-1.5 rounded-lg border border-secondary-200 bg-white px-3 py-1.5 text-xs font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Return to Fields of Study
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-secondary-950 sm:text-3xl">
                {activeCategoryLabel ?? "Explore Global Scholarships"}
              </h1>
              <p className="mt-1 text-sm text-secondary-600">
                {activeCategoryLabel
                  ? `Browse verified ${activeCategoryLabel.toLowerCase()} from accredited universities, governments, and foundations.`
                  : "Browse verified opportunities from accredited universities, governments, and foundations."}
              </p>
            </>
          )}

          {activeChips.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-secondary-200 bg-white p-3 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
                Active filters
              </span>
              {activeChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={() => handleRemoveFilter(chip.key)}
                    className="rounded-full p-0.5 text-primary-600 transition-colors hover:bg-primary-100 hover:text-primary-800"
                    aria-label={`Remove ${chip.label} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto text-xs font-semibold text-primary-600 underline underline-offset-4 transition-colors hover:text-primary-700"
              >
                Clear all
              </button>
            </div>
          )}

        </div>

        {/* Top Control Bar: Total results & View Mode */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-secondary-200 bg-white p-4 shadow-card">
          <div className="flex items-center gap-2">
            <span className="font-bold text-secondary-900 text-sm">{result.total}</span>
            <span className="text-sm text-secondary-600">
              {result.total === 1 ? "scholarship" : "scholarships"} found
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              aria-expanded={isMobileFilterOpen}
              aria-controls={isMobileFilterOpen ? "scholarship-filters" : undefined}
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-secondary-200 px-4 text-sm font-medium text-secondary-700 hover:bg-secondary-50 lg:hidden"
            >
              <Filter className="h-4 w-4" />
              Filters
              {isMobileFilterOpen && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-100 px-1.5 text-[10px] font-bold text-primary-700">✕</span>}
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

          </div>
        </div>

        {/* Main Grid: Left Filters + Right Results */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Left Sidebar Filters for Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <SearchFilters
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              countries={countries}
              fields={fields}
              universities={universities}
              intakes={intakes}
            />
          </div>

          {/* Mobile Filter Drawer / Collapsible */}
          {isMobileFilterOpen && (
            <div id="scholarship-filters" className="block lg:hidden mb-4">
              <SearchFilters
                filters={filters}
                onChange={(f) => {
                  handleFilterChange(f);
                  setIsMobileFilterOpen(false);
                }}
                onReset={() => {
                  handleResetFilters();
                  setIsMobileFilterOpen(false);
                }}
                countries={countries}
                fields={fields}
                universities={universities}
                intakes={intakes}
              />
            </div>
          )}

          {/* Right Results Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-72 rounded-2xl bg-white border border-secondary-200 animate-pulse p-5" />
                ))}
              </div>
            ) : result.data.length === 0 ? (
              /* Empty State */
              <div className="rounded-2xl border border-dashed border-secondary-300 bg-white p-16 text-center">
                <Inbox className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-base font-bold text-secondary-900 mb-2">
                  No scholarships found
                </h3>
                <p className="text-sm text-secondary-500 max-w-sm mx-auto mb-6">
                  We couldn&apos;t find any opportunities matching your active
                  filters. Try broadening your criteria or resetting filters.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-secondary-200 bg-white px-5 py-2.5 text-sm font-semibold text-secondary-700 shadow-sm hover:bg-secondary-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset all filters
                  </button>
                  <Link
                    href="/scholarships"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
                  >
                    Browse all scholarships
                  </Link>
                </div>
              </div>
            ) : (
              /* Results List */
              <>
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}>
                  {result.data.map((sch) => (
                    <ScholarshipCard key={sch.id} scholarship={sch} />
                  ))}
                </div>

                {/* Pagination Controls */}
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
