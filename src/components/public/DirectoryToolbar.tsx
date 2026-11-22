"use client";

import { ChevronDown, LayoutGrid, LayoutList } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface SortOption {
  value: string;
  label: string;
}

interface DirectoryToolbarProps {
  totalCount: number;
  showingFrom: number;
  showingTo: number;
  sort: string;
  view: "grid" | "list";
  onSortChange: (value: string) => void;
  onViewChange: (mode: "grid" | "list") => void;
  sortOptions?: SortOption[];
}

const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: "ranking", label: "Best ranking first" },
  { value: "name", label: "Alphabetical A–Z" },
  { value: "scholarships", label: "Most scholarships" },
  { value: "country", label: "Country (A–Z)" },
];

export function DirectoryToolbar({
  totalCount,
  showingFrom,
  showingTo,
  sort,
  view,
  onSortChange,
  onViewChange,
  sortOptions = DEFAULT_SORT_OPTIONS,
}: DirectoryToolbarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleViewChange = (mode: "grid" | "list") => {
    onViewChange(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.push(`/universities?${params.toString()}`);
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-card">
      {/* Result count */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-dark">{totalCount.toLocaleString()}</span>{" "}
        <span className="text-sm text-muted">
          {totalCount === 1 ? "university" : "universities"}
        </span>
        {totalCount > 0 && showingFrom > 0 && showingTo > 0 && (
          <span className="ml-2 text-xs text-muted">
            &middot; showing {showingFrom}&ndash;{showingTo}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs font-semibold text-muted">
            View:
          </span>
          <div className="inline-flex rounded-lg border border-border bg-surface shadow-sm">
            <button
              type="button"
              onClick={() => handleViewChange("grid")}
              aria-label="Grid view"
              className={cn(
                "p-2 text-sm transition-colors",
                view === "grid"
                  ? "bg-primary-600 text-white"
                  : "text-muted hover:bg-surface hover:text-dark"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("list")}
              aria-label="List view"
              className={cn(
                "p-2 text-sm transition-colors",
                view === "list"
                  ? "bg-primary-600 text-white"
                  : "text-muted hover:bg-surface hover:text-dark"
              )}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sort dropdown */}
        <div className="relative flex-shrink-0 min-w-[150px]">
          <label className="sr-only">Sort universities by</label>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="min-h-[42px] w-full appearance-none rounded-lg border border-border bg-surface pl-3 pr-9 py-2 text-sm text-dark shadow-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-1"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
