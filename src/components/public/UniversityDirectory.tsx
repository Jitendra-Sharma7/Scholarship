"use client";

import { useMemo } from "react";
import { ChevronDown, ArrowRight, LayoutGrid, LayoutList, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";
import { UNIVERSITY_PAGE_SIZE } from "@/lib/page-size";
import type { PublicUniversity } from "@/lib/data/public";
import type {
  UniversityFilterOptions,
} from "@/lib/data/public";
import { UniversityCard } from "@/components/public/UniversityCard";
import { UniversityRow } from "@/components/public/UniversityRow";
import { FilterChip } from "@/components/public/UniversitySearch";
import { UniversityFilters } from "@/components/public/UniversityFilters";
import { Button } from "@/components/ui/Button";
import { cn, formatNumber } from "@/lib/utils";

interface UniversityDirectoryProps {
  universities: PublicUniversity[];
  filterOptions: UniversityFilterOptions;
  totalUniversities: number;
  countriesCount: number;
  universitiesWithScholarships: number;
  initial: DirectoryState;
  error: Error | null;
}

type View = "grid" | "list";

export interface DirectoryState {
  country: string;
  ranking: string;
  studyLevel: string;
  scholarships: string;
  field: string;
  type: string;
  intake: string;
  tuitionRange: string;
  q: string;
  sort: string;
  view: View;
  page: number;
}

export type FilterValues = Pick<
  DirectoryState,
  | "country"
  | "ranking"
  | "studyLevel"
  | "scholarships"
  | "field"
  | "type"
  | "intake"
  | "tuitionRange"
  | "sort"
>;

const DEFAULT_STATE: DirectoryState = {
  country: "all",
  ranking: "all",
  studyLevel: "all",
  scholarships: "all",
  field: "all",
  type: "all",
  intake: "all",
  tuitionRange: "all",
  q: "",
  sort: "ranking",
  view: "grid",
  page: 1,
};

const SORT_OPTIONS = [
  { value: "ranking", label: "Best ranking first" },
  { value: "lowest", label: "Lowest ranking first" },
  { value: "name", label: "University name (A-Z)" },
  { value: "scholarships", label: "Most scholarships" },
  { value: "country", label: "Country (A-Z)" },
] as const;

const RANKING_LABELS: Record<string, string> = {
  top10: "Top 10",
  top50: "Top 50",
  top100: "Top 100",
  top500: "Top 500",
  unranked: "Unranked",
};

const STUDY_LEVEL_MAP: Record<string, string[]> = {
  ug: ["Undergraduate"],
  pg: ["Master's", "MBA", "Doctoral", "JD", "MD"],
  phd: ["PhD"],
};

const RANKING_TIERS: Record<string, { max: number } | null> = {
  top10: { max: 10 },
  top50: { max: 50 },
  top100: { max: 100 },
  top500: { max: 500 },
  unranked: null,
};

const TUITION_RANGE_LABELS: Record<string, string> = {
  free: "Free / No tuition",
  low: "Low (under $10k)",
  medium: "Moderate ($10k-$30k)",
  high: "High ($30k+)",
};

const PARAM_KEYS: Record<keyof DirectoryState, string> = {
  country: "c",
  ranking: "r",
  studyLevel: "l",
  scholarships: "s",
  field: "f",
  type: "t",
  intake: "i",
  tuitionRange: "tr",
  q: "q",
  sort: "sort",
  view: "view",
  page: "page",
};

function buildQuery(state: DirectoryState): string {
  const params = new URLSearchParams();
  if (state.q) params.set(PARAM_KEYS.q, state.q);
  if (state.country !== "all") params.set(PARAM_KEYS.country, state.country);
  if (state.ranking !== "all") params.set(PARAM_KEYS.ranking, state.ranking);
  if (state.studyLevel !== "all")
    params.set(PARAM_KEYS.studyLevel, state.studyLevel);
  if (state.scholarships !== "all")
    params.set(PARAM_KEYS.scholarships, state.scholarships);
  if (state.field !== "all") params.set(PARAM_KEYS.field, state.field);
  if (state.type !== "all") params.set(PARAM_KEYS.type, state.type);
  if (state.intake !== "all") params.set(PARAM_KEYS.intake, state.intake);
  if (state.tuitionRange !== "all") params.set(PARAM_KEYS.tuitionRange, state.tuitionRange);
  if (state.sort !== "ranking") params.set(PARAM_KEYS.sort, state.sort);
  if (state.view !== "grid") params.set(PARAM_KEYS.view, state.view);
  if (state.page > 1) params.set(PARAM_KEYS.page, String(state.page));
  return params.toString();
}

function universityRanking(u: PublicUniversity): number | null {
  return u.qsRanking ?? u.theRanking ?? null;
}

export function UniversityDirectory({
  universities,
  filterOptions,
  initial,
  error,
}: UniversityDirectoryProps) {
  const router = useRouter();

  // Filter state is driven by the URL. `initial` carries the server-rendered
  // query params; client-side navigations (router.replace) supply new params,
  // which re-render this page with an updated `initial`, so filters, search,
  // sort, view and pagination survive a trip to a university profile and back.
  const state = useMemo(
    () => ({ ...DEFAULT_STATE, ...initial }),
    [initial]
  );

  const navigate = (patch: Partial<FilterValues>, resetPage = true) => {
    const next: DirectoryState = {
      ...state,
      ...patch,
      page: resetPage ? 1 : state.page,
    };
    router.replace(buildQuery(next), { scroll: false });
  };

  const removeFilter = (key: keyof FilterValues) => {
    const next: DirectoryState = {
      ...state,
      [key]: "all",
      page: 1,
    };
    router.replace(buildQuery(next), { scroll: false });
  };

  const clearAll = () => {
    router.replace(buildQuery(DEFAULT_STATE), { scroll: false });
  };

  const hasActiveFilters = Object.entries(state).some(
    ([key, value]) =>
      key !== "sort" && key !== "view" && key !== "page"
        ? value !== "all" && value !== ""
        : false
  );

  const filtered = useMemo(() => {
    const term = state.q.trim().toLowerCase();
    let result = [...universities];

    if (term) {
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.country.toLowerCase().includes(term) ||
          (u.city ?? "").toLowerCase().includes(term) ||
          u.programs.some((p) => p.toLowerCase().includes(term))
      );
    }

    if (state.country !== "all") {
      result = result.filter((u) => u.country === state.country);
    }

    if (state.ranking !== "all") {
      const tier = RANKING_TIERS[state.ranking];
      result = result.filter((u) => {
        const rank = universityRanking(u);
        if (tier === null) return rank === null;
        return rank !== null && rank <= tier.max;
      });
    }

    if (state.studyLevel !== "all") {
      const levels = STUDY_LEVEL_MAP[state.studyLevel];
      result = result.filter((u) =>
        u.scholarships?.some((s) =>
          s.degreeLevels.some((level) => levels.includes(level))
        )
      );
    }

    if (state.scholarships !== "all") {
      if (state.scholarships === "with") {
        result = result.filter((u) => u.scholarshipCount > 0);
      } else {
        result = result.filter((u) => u.scholarshipCount === 0);
      }
    }

    if (state.field !== "all") {
      result = result.filter((u) => u.popularFields.includes(state.field));
    }

    if (state.type !== "all") {
      result = result.filter((u) => u.type === state.type);
    }

    if (state.intake !== "all") {
      result = result.filter((u) =>
        u.scholarships?.some((s) =>
          s.intakes.some((link) => link.intake.slug === state.intake)
        )
      );
    }

    if (state.tuitionRange !== "all") {
      result = result.filter((u) => {
        if (!u.tuitionInfo) return false;
        const text = u.tuitionInfo.toLowerCase();
        if (state.tuitionRange === "free") {
          return text.includes("free") || text.includes("no tuition") || text.includes("€0") || text.includes("$0");
        } else if (state.tuitionRange === "low") {
          return text.includes("low") || text.includes("affordable") || text.includes("cheap") || /€?[0-9],?[0-9]{3}\b/.test(text) || /\$?[0-9],?[0-9]{3}\b/.test(text);
        } else if (state.tuitionRange === "medium") {
          return /€?[0-9]{2},?[0-9]{3}\b/.test(text) || /\$?[0-9]{2},?[0-9]{3}\b/.test(text);
        } else if (state.tuitionRange === "high") {
          return /€?[3-9][0-9],?[0-9]{3}\b/.test(text) || /\$?[3-9][0-9],?[0-9]{3}\b/.test(text);
        }
        return true;
      });
    }

    const ranked = (u: PublicUniversity) =>
      u.qsRanking ?? u.theRanking ?? Infinity;

    result.sort((a, b) => {
      switch (state.sort) {
        case "ranking":
          return ranked(a) - ranked(b);
        case "lowest": {
          const ra = universityRanking(a) ?? Infinity;
          const rb = universityRanking(b) ?? Infinity;
          return rb - ra;
        }
        case "name":
          return a.name.localeCompare(b.name);
        case "scholarships":
          return b.scholarshipCount - a.scholarshipCount;
        case "country":
          return a.country.localeCompare(b.country);
        default:
          return 0;
      }
    });

    return result;
  }, [universities, state]);

  const applyPage = (page: number) => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / UNIVERSITY_PAGE_SIZE));
    const clamped = Math.min(Math.max(page, 1), totalPages);
    const next: DirectoryState = { ...state, page: clamped };
    router.replace(buildQuery(next), { scroll: false });
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / UNIVERSITY_PAGE_SIZE));
  const safePage = Math.min(Math.max(state.page, 1), totalPages);
  const start = (safePage - 1) * UNIVERSITY_PAGE_SIZE;
  const visible = filtered.slice(start, start + UNIVERSITY_PAGE_SIZE);

  const chips = useMemo(() => {
    const items: { key: keyof FilterValues; label: string }[] = [];
    if (state.q) items.push({ key: "q", label: `Search: "${state.q}"` } as never);
    if (state.country !== "all")
      items.push({
        key: "country",
        label: `Country: ${filterOptions.countries.find((c) => c.name === state.country)?.name ?? state.country}`,
      });
    if (state.ranking !== "all")
      items.push({
        key: "ranking",
        label: `Ranking: ${RANKING_LABELS[state.ranking] ?? state.ranking}`,
      });
    if (state.studyLevel !== "all")
      items.push({
        key: "studyLevel",
        label: `Study level: ${filterOptions.studyLevels.find((s) => s.value === state.studyLevel)?.label ?? state.studyLevel}`,
      });
    if (state.scholarships !== "all")
      items.push({
        key: "scholarships",
        label: `Scholarships: ${state.scholarships === "with" ? "With scholarships" : "Without scholarships"}`,
      });
    if (state.field !== "all")
      items.push({ key: "field", label: `Subject: ${state.field}` });
    if (state.type !== "all")
      items.push({ key: "type", label: `Type: ${state.type}` });
    if (state.intake !== "all")
      items.push({
        key: "intake",
        label: `Intake: ${filterOptions.intakes.find((x) => x.slug === state.intake)?.name ?? state.intake}`,
      });
    if (state.tuitionRange !== "all")
      items.push({
        key: "tuitionRange",
        label: `Tuition: ${TUITION_RANGE_LABELS[state.tuitionRange] ?? state.tuitionRange}`,
      });
    return items;
  }, [state, filterOptions]);

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-secondary-300 bg-white p-16 text-center">
        <h3 className="text-base font-semibold text-secondary-900 mb-1">
          We could not load the directory
        </h3>
        <p className="text-sm text-secondary-500 mb-6">
          Please try again. If the problem persists, contact support.
        </p>
        <Button onClick={() => window.location.reload()} size="sm">
          <ArrowRight className="h-3.5 w-3.5" /> Try again
        </Button>
      </div>
    );
  }

  const showingFrom = filtered.length > 0 ? start + 1 : 0;
  const showingTo = Math.min(start + UNIVERSITY_PAGE_SIZE, filtered.length);

  return (
    <div className="space-y-8">
      {/* Results toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-secondary-900">
            {formatNumber(filtered.length)}
          </span>{" "}
          <span className="text-sm text-secondary-500">
            {filtered.length === 1 ? "university" : "universities"}
          </span>
          {filtered.length > 0 && (
            <span className="ml-2 text-xs text-secondary-500">
              &middot; showing {showingFrom}&ndash;{showingTo}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {chips.length > 0 && (
            <>
              <span className="text-xs font-semibold text-secondary-500 hidden sm:block">
                Applied filters:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <FilterChip
                    key={chip.key}
                    label={chip.label}
                    onRemove={() => removeFilter(chip.key as keyof FilterValues)}
                  />
                ))}
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-primary-600 underline underline-offset-4 hover:text-primary-700"
                >
                  Clear all
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="hidden sm:block text-xs font-semibold text-secondary-500">
            View:
          </span>
          <div className="inline-flex rounded-lg border border-secondary-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => {
                router.replace(buildQuery({ ...state, view: "grid" }), {
                  scroll: false,
                });
              }}
              aria-label="Grid view"
              className={cn(
                "p-2 text-sm transition-colors",
                state.view === "grid"
                  ? "bg-primary-600 text-white"
                  : "text-secondary-600 hover:bg-secondary-50"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                router.replace(buildQuery({ ...state, view: "list" }), {
                  scroll: false,
                });
              }}
              aria-label="List view"
              className={cn(
                "p-2 text-sm transition-colors",
                state.view === "list"
                  ? "bg-primary-600 text-white"
                  : "text-secondary-600 hover:bg-secondary-50"
              )}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
          <span className="relative block min-w-[150px]">
            <select
              value={state.sort}
              onChange={(e) =>
                navigate({ sort: e.target.value as DirectoryState["sort"] })
              }
              className="min-h-[42px] w-full appearance-none rounded-lg border border-secondary-300 bg-white pl-3 pr-9 py-2 text-sm text-secondary-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400 pointer-events-none"
            />
          </span>
        </div>
      </div>

      {/* Filter panel */}
      <UniversityFilters
        countries={filterOptions.countries}
        types={filterOptions.types}
        fields={filterOptions.fields}
        intakes={filterOptions.intakes}
        studyLevels={filterOptions.studyLevels}
        values={{
          country: state.country,
          ranking: state.ranking,
          studyLevel: state.studyLevel,
          scholarships: state.scholarships,
          field: state.field,
          type: state.type,
          intake: state.intake,
          tuitionRange: state.tuitionRange,
        }}
        onFilterChange={(patch) => navigate(patch)}
        onClearAll={clearAll}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-secondary-300 bg-white p-16 text-center">
          <h3 className="text-base font-semibold text-secondary-900 mb-1">
            No universities found
          </h3>
          <p className="text-sm text-secondary-500 max-w-sm mx-auto mb-6">
            Try adjusting your search or filters to find what you&rsquo;re
            looking for.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <ArrowRight className="h-3.5 w-3.5" /> Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="transition-opacity duration-200">
            {state.view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visible.map((u) => (
                  <UniversityCard
                    key={u.id}
                    university={u}
                    priority={u.id === visible[0]?.id}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-0">
                {visible.map((u) => (
                  <UniversityRow key={u.id} university={u} />
                ))}
              </div>
            )}
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={applyPage}
            label="University list pages"
          />
        </>
      )}
    </div>
  );
}