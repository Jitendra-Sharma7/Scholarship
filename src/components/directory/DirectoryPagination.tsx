"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DirectoryPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  const shown: (number | "gap")[] = [];
  const add = (n: number) => {
    if (shown[shown.length - 1] !== n) shown.push(n);
  };

  add(1);
  for (let n = page - 1; n <= page + 1; n += 1) {
    if (n > 1 && n < totalPages) add(n);
  }
  if (totalPages > 1) add(totalPages);

  const withGaps: (number | "gap")[] = [];
  shown.forEach((n, i) => {
    const prev = shown[i - 1];
    if (i > 0 && typeof n === "number" && typeof prev === "number" && n - prev > 1) {
      withGaps.push("gap");
    }
    withGaps.push(n);
  });
  return withGaps;
}

export function DirectoryPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: DirectoryPaginationProps) {
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  if (totalPages <= 1) return null;

  const startItem = (safePage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safePage * itemsPerPage, totalItems);

  return (
    <nav aria-label="Scholarship directory pagination" className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <div className="text-sm text-secondary-600">
        Showing <span className="font-semibold text-secondary-900">{startItem}</span>–{" "}
        <span className="font-semibold text-secondary-900">{endItem}</span> of{" "}
        <span className="font-semibold text-secondary-900">{totalItems}</span> scholarships
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          aria-label="Previous page"
          className={cn(
            "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors",
            safePage === 1
              ? "border-secondary-200 bg-white text-secondary-400 cursor-not-allowed"
              : "border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-50"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageWindow(safePage, totalPages).map((n, i) =>
          n === "gap" ? (
            <span key={`gap-${i}`} className="px-1.5 text-sm text-secondary-400" aria-hidden="true">
              &hellip;
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              aria-current={n === safePage ? "page" : undefined}
              aria-label={`Page ${n}`}
              className={cn(
                "min-h-[44px] min-w-[44px] rounded-xl px-3 text-sm font-semibold transition-colors",
                n === safePage
                  ? "bg-primary-600 text-white"
                  : "border border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-50"
              )}
            >
              {n}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === totalPages}
          aria-label="Next page"
          className={cn(
            "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors",
            safePage === totalPages
              ? "border-secondary-200 bg-white text-secondary-400 cursor-not-allowed"
              : "border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-50"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}