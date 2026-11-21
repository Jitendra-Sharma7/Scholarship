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
}

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
}: ResultsBarProps) {
  return (
    <div className="rounded-xl border border-[var(--gs-border)] bg-[var(--gs-surface)] shadow-sm">
      <div className="border-b border-[var(--gs-border)] px-5 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--gs-text)]">
              {totalCount.toLocaleString()}
            </span>{" "}
            <span className="text-[12px] text-[var(--gs-muted)]">
              {totalCount === 1 ? "university" : "universities"}
            </span>
            {totalCount > 0 && showingFrom != null && showingTo != null && (
              <span className="ml-2 text-[12px] text-[var(--gs-muted)]">
                &middot; showing {showingFrom}&ndash;{showingTo}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 min-w-0">
            {onFilterToggle && (
              <button
                type="button"
                onClick={onFilterToggle}
                className={cn(
                  "lg:hidden inline-flex items-center gap-2 rounded-[10px] border border-[var(--gs-border)] bg-[var(--gs-surface)] px-3 py-2 text-sm font-medium text-[var(--gs-text)] transition-colors hover:bg-[var(--gs-muted)]/10",
                  activeFilterCount && activeFilterCount > 0
                    ? "border-[var(--gs-brand)] bg-[var(--gs-soft-brand)] text-[var(--gs-brand)]"
                    : "hover:border-[var(--gs-muted)]",
                )}
                aria-label="Open filters"
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount && activeFilterCount > 0 && (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gs-brand)] px-1.5 text-[10px] font-bold text-[var(--gs-brand-text)]">
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
                className="w-full appearance-none rounded-[10px] border border-[var(--gs-border)] bg-[var(--gs-surface)] pl-3 pr-10 py-2.5 text-sm text-[var(--gs-text)] shadow-sm transition-colors focus:border-[var(--gs-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)]/20 focus:ring-offset-1"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gs-muted)] pointer-events-none"
              />
            </div>

            <div className="inline-flex rounded-[10px] border border-[var(--gs-border)] bg-[var(--gs-surface)] shadow-sm">
              <button
                type="button"
                onClick={() => onViewChange("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                className={cn(
                  "p-2 text-sm transition-colors",
                  view === "grid"
                    ? "bg-[var(--gs-brand)] text-[var(--gs-brand-text)]"
                    : "text-[var(--gs-muted)] hover:bg-[var(--gs-muted)]/10 hover:text-[var(--gs-text)]",
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
                    ? "bg-[var(--gs-brand)] text-[var(--gs-brand-text)]"
                    : "text-[var(--gs-muted)] hover:bg-[var(--gs-muted)]/10 hover:text-[var(--gs-text)]",
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
