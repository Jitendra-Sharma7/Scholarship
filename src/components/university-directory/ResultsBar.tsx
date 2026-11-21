"use client";

import { ChevronDown, LayoutGrid, LayoutList, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultsBarProps {
  totalCount: number;
  showingFrom: number | null;
  showingTo: number | null;
  sort: string;
  view: "grid" | "list";
  onSortChange: (value: string) => void;
  onViewChange: (mode: "grid" | "list") => void;
  onFilterToggle?: () => void;
  activeFilterCount?: number;
  onCategoryChange?: (category: string) => void;
  activeCategory?: string;
}

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Universities" },
  { value: "popular", label: "Popular" },
  { value: "top-ranked", label: "Top Ranked" },
  { value: "scholarships", label: "Scholarships" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "ranking", label: "Best ranking" },
  { value: "name", label: "Name A to Z" },
  { value: "scholarships", label: "Most scholarships" },
  { value: "lowest", label: "Lowest tuition" },
];

export function ResultsBar({
  totalCount,
  showingFrom,
  showingTo,
  sort,
  view,
  onSortChange,
  onViewChange,
  onFilterToggle,
  activeFilterCount,
  onCategoryChange,
  activeCategory = "all",
}: ResultsBarProps) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] shadow-sm">
      <div className="border-b border-[#E2E8F0] px-5 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#15264A]">
              {totalCount.toLocaleString()}
            </span>{" "}
            <span className="text-[12px] text-[#64748B]">
              {totalCount === 1 ? "university" : "universities"}
            </span>
            {totalCount > 0 && showingFrom != null && showingTo != null && (
              <span className="ml-2 text-[12px] text-[#64748B]">
                &middot; showing {showingFrom}&ndash;{showingTo}
              </span>
            )}
          </div>

          {/* Category tabs: All Universities, Popular, Top Ranked, Scholarships */}
          <div className="hidden lg:flex items-center gap-1">
            {CATEGORY_OPTIONS.map((o) => {
              const active = activeCategory === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onCategoryChange?.(o.value)}
                  aria-pressed={active}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                    active
                      ? "bg-[#1747D1] text-[#FFFFFF]"
                      : "text-[#64748B] hover:bg-[#F3F7FF] hover:text-[#15264A]",
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 min-w-0">
            {onFilterToggle && (
              <button
                type="button"
                onClick={onFilterToggle}
                className={cn(
                  "lg:hidden inline-flex items-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-[#FFFFFF] px-3 py-2 text-sm font-medium text-[#15264A] transition-colors hover:bg-[#F3F7FF]",
                  activeFilterCount && activeFilterCount > 0
                    ? "border-[#1747D1] bg-[#E2F2FF] text-[#1747D1]"
                    : "hover:border-[#64748B]",
                )}
                aria-label="Open filters"
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount && activeFilterCount > 0 && (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1747D1] px-1.5 text-[10px] font-bold text-[#FFFFFF]">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}

            <div className="relative flex-shrink-0 min-w-[150px]">
              <label className="sr-only">Sort universities by</label>
              <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full appearance-none rounded-[10px] border border-[#E2E8F0] bg-[#FFFFFF] pl-3 pr-10 py-2.5 text-sm text-[#15264A] shadow-sm transition-colors focus:border-[#1747D1] focus:outline-none focus:ring-2 focus:ring-[#1747D1]/20 focus:ring-offset-1"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] pointer-events-none"
              />
            </div>

            <div className="inline-flex rounded-[10px] border border-[#E2E8F0] bg-[#FFFFFF] shadow-sm">
              <button
                type="button"
                onClick={() => onViewChange("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                className={cn(
                  "p-2 text-sm transition-colors",
                  view === "grid"
                    ? "bg-[#1747D1] text-[#FFFFFF]"
                    : "text-[#64748B] hover:bg-[#F3F7FF] hover:text-[#15264A]",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onViewChange("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                className={cn(
                  "p-2 text-sm transition-colors",
                  view === "list"
                    ? "bg-[#1747D1] text-[#FFFFFF]"
                    : "text-[#64748B] hover:bg-[#F3F7FF] hover:text-[#15264A]",
                )}
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
