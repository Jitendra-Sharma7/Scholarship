"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, ExternalLink, Building2, Filter, X, ChevronDown, Globe, Trophy, Shield, GraduationCap, Award, MapPin } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { UNIVERSITY_PAGE_SIZE } from "@/lib/page-size";
import type { PublicUniversity } from "@/lib/data/public";

interface UniversitiesBrowserProps {
  universities: PublicUniversity[];
  countries: string[];
}

const SORT_OPTIONS = [
  { value: "ranking", label: "Ranking (Best First)" },
  { value: "name", label: "Name (A-Z)" },
  { value: "scholarships", label: "Most Scholarships" },
  { value: "students", label: "Largest Student Body" },
  { value: "international", label: "Highest Intl %" },
] as const;

const RANKING_FILTERS = [
  { value: "all", label: "All Rankings" },
  { value: "top10", label: "Top 10 (QS/THE)" },
  { value: "top50", label: "Top 50" },
  { value: "top100", label: "Top 100" },
  { value: "top500", label: "Top 500" },
  { value: "unranked", label: "Unranked" },
] as const;

const TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "non-profit", label: "Non-Profit" },
  { value: "for-profit", label: "For-Profit" },
] as const;

export function UniversitiesBrowser({ universities, countries }: UniversitiesBrowserProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [rankingFilter, setRankingFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [hasScholarshipsFilter, setHasScholarshipsFilter] = useState(false);
  const [sortBy, setSortBy] = useState("ranking");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...universities];

    // Search filter
    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.country.toLowerCase().includes(term) ||
          (u.city ?? "").toLowerCase().includes(term) ||
          u.programs.some((p) => p.toLowerCase().includes(term))
      );
    }

    // Country filter
    if (countryFilter !== "all") {
      result = result.filter((u) => u.country === countryFilter);
    }

    // Ranking filter
    if (rankingFilter !== "all") {
      const ranking = (u: PublicUniversity) => u.qsRanking ?? u.theRanking ?? 9999;
      switch (rankingFilter) {
        case "top10":
          result = result.filter((u: PublicUniversity) => ranking(u) <= 10);
          break;
        case "top50":
          result = result.filter((u: PublicUniversity) => ranking(u) <= 50);
          break;
        case "top100":
          result = result.filter((u: PublicUniversity) => ranking(u) <= 100);
          break;
        case "top500":
          result = result.filter((u: PublicUniversity) => ranking(u) <= 500);
          break;
        case "unranked":
          result = result.filter((u: PublicUniversity) => ranking(u) > 500);
          break;
      }
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((u) => (u.type?.toLowerCase() ?? "") === typeFilter);
    }

    // Has scholarships filter
    if (hasScholarshipsFilter) {
      result = result.filter((u) => u.scholarshipCount > 0);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "ranking": {
          const rankA = a.qsRanking ?? a.theRanking ?? 9999;
          const rankB = b.qsRanking ?? b.theRanking ?? 9999;
          return rankA - rankB;
        }
        case "name":
          return a.name.localeCompare(b.name);
        case "scholarships":
          return b.scholarshipCount - a.scholarshipCount;
        case "students":
          return (b.studentCount ?? 0) - (a.studentCount ?? 0);
        case "international":
          return (b.internationalStudentPercent ?? 0) - (a.internationalStudentPercent ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [universities, search, countryFilter, rankingFilter, typeFilter, hasScholarshipsFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / UNIVERSITY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * UNIVERSITY_PAGE_SIZE;
  const visible = filtered.slice(start, start + UNIVERSITY_PAGE_SIZE);

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch("");
    setCountryFilter("all");
    setRankingFilter("all");
    setTypeFilter("all");
    setHasScholarshipsFilter(false);
    setPage(1);
  };

  const hasActiveFilters = 
    search !== "" ||
    countryFilter !== "all" ||
    rankingFilter !== "all" ||
    typeFilter !== "all" ||
    hasScholarshipsFilter;

  const getRankingBadge = (university: PublicUniversity) => {
    const ranking = university.qsRanking ?? university.theRanking;
    if (!ranking) return null;
    if (ranking <= 10) return { label: `QS #${ranking}`, color: "bg-amber-100 text-amber-800 border-amber-300", icon: <Trophy className="h-3 w-3 fill-current" /> };
    if (ranking <= 50) return { label: `QS #${ranking}`, color: "bg-blue-100 text-blue-800 border-blue-300", icon: <Award className="h-3 w-3" /> };
    if (ranking <= 100) return { label: `#${ranking}`, color: "bg-green-100 text-green-800 border-green-300", icon: <Award className="h-3 w-3" /> };
    if (ranking <= 500) return { label: `#${ranking}`, color: "bg-gray-100 text-gray-800 border-gray-300", icon: <Award className="h-3 w-3" /> };
    return { label: `#${ranking}`, color: "bg-gray-100 text-gray-600 border-gray-200", icon: <Award className="h-3 w-3" /> };
  };

  return (
    <>
      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-4">
        {/* Main Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <label htmlFor="university-search" className="sr-only">
            Search universities by name, country, city, or subject
          </label>
          <input
            id="university-search"
            type="search"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Search universities by name, country, city, or program..."
            className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm shadow-xs focus:border-primary-500 focus:outline-none"
          />
        </div>

        {/* Quick Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Country Filter */}
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <label htmlFor="country-filter" className="sr-only">Filter by country</label>
            <select
              id="country-filter"
              value={countryFilter}
              onChange={(e) => { setCountryFilter(e.target.value); handleFilterChange(); }}
              className="min-h-[44px] appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-10 py-2 text-sm shadow-xs focus:border-primary-500 focus:outline-none"
            >
              <option value="all">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Ranking Filter */}
          <div className="relative">
            <Trophy className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <label htmlFor="ranking-filter" className="sr-only">Filter by ranking</label>
            <select
              id="ranking-filter"
              value={rankingFilter}
              onChange={(e) => { setRankingFilter(e.target.value); handleFilterChange(); }}
              className="min-h-[44px] appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-10 py-2 text-sm shadow-xs focus:border-primary-500 focus:outline-none"
            >
              {RANKING_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Advanced Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              showAdvancedFilters
                ? "bg-primary-600 border-primary-600 text-white"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {[
                  search !== "",
                  countryFilter !== "all",
                  rankingFilter !== "all",
                  typeFilter !== "all",
                  hasScholarshipsFilter,
                ].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="relative ml-auto">
            <label htmlFor="sort-select" className="sr-only">Sort universities</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); handleFilterChange(); }}
              className="min-h-[44px] appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-10 py-2 text-sm shadow-xs focus:border-primary-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Advanced Filters</h4>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type Filter */}
              <div>
                <label htmlFor="type-filter" className="block text-xs font-medium text-gray-500 mb-1.5">
                  Institution Type
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    id="type-filter"
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); handleFilterChange(); }}
                    className="min-h-[44px] w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-10 py-2 text-sm shadow-xs focus:border-primary-500 focus:outline-none"
                  >
                    {TYPE_FILTERS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Has Scholarships Filter */}
              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasScholarshipsFilter}
                    onChange={(e) => { setHasScholarshipsFilter(e.target.checked); handleFilterChange(); }}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Only show universities with scholarships</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Results Info */}
        <p className="text-sm text-gray-600" role="status">
          <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "university" : "universities"}
          {filtered.length > 0 && (
            <span className="text-gray-500">
              {" "}
              &middot; showing {start + 1}&ndash;{Math.min(start + UNIVERSITY_PAGE_SIZE, filtered.length)}
            </span>
          )}
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
              <Filter className="h-3 w-3" />
              Filters active
            </span>
          )}
        </p>
      </div>

      {/* University Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">No universities found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <X className="h-4 w-4" />
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((u) => {
              const rankingBadge = getRankingBadge(u);
              return (
                <Link
                  key={u.id}
                  href={`/universities/${u.id}`}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {u.logo ? (
                        <img
                          src={u.logo}
                          alt={u.name}
                          className="h-10 w-10 rounded-lg object-contain"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                          <Building2 className="h-5 w-5" />
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        {rankingBadge && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${rankingBadge.color}`}>
                            {rankingBadge.icon}
                            {rankingBadge.label}
                          </span>
                        )}
                        <span className="rounded-md bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 text-[11px] font-bold">
                          {u.scholarshipCount} Scholarships
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-primary-600 transition-colors">
                      {u.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 mb-3 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[u.city, u.country].filter(Boolean).join(", ")}
                    </p>

                    {u.description && (
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-4">
                        {u.description}
                      </p>
                    )}

                    <div className="space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-600">
                      {u.programs.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-900">Popular: </span>
                          <span>{u.programs.slice(0, 3).join(", ")}</span>
                        </div>
                      )}
                      {u.internationalStudentPercent != null && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span className="font-semibold text-gray-900">Intl Students: </span>
                          <span>{u.internationalStudentPercent}%</span>
                        </div>
                      )}
                      {u.studentCount && (
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          <span className="font-semibold text-gray-900">Students: </span>
                          <span>{u.studentCount.toLocaleString()}</span>
                        </div>
                      )}
                      {u.type && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span className="font-semibold text-gray-900">Type: </span>
                          <span className="capitalize">{u.type}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2">
                    <span className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 py-2.5 text-xs font-bold text-white hover:bg-primary-700 transition-colors">
                      <span>View Profile</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                    {u.website && (
                      <a
                        href={u.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        title="Official Website"
                        onClick={(e) => e.preventDefault()}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            label="University list pages"
          />
        </>
      )}
    </>
  );
}