"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

/** Page numbers with gaps, e.g. 1 … 4 5 6 … 20. */
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

interface UniversityPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export function UniversityPagination({
  page,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  label = "University list pages",
}: UniversityPaginationProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const safePage = Math.min(Math.max(page, 1), totalPages);
  if (totalPages <= 1) return null;

  const showingFrom = totalItems > 0 ? (safePage - 1) * itemsPerPage + 1 : 0;
  const showingTo = Math.min(safePage * itemsPerPage, totalItems);

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`/universities?${params.toString()}`);
    onPageChange(nextPage);
  };

  return (
    <nav aria-label={label} className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      <button
        onClick={() => handlePageChange(safePage - 1)}
        disabled={safePage === 1}
        aria-label="Previous page"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-dark transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pageWindow(safePage, totalPages).map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} className="px-1.5 text-sm text-muted" aria-hidden="true">
            &hellip;
          </span>
        ) : (
          <button
            key={n}
            onClick={() => handlePageChange(n)}
            aria-current={n === safePage ? "page" : undefined}
            className={`min-h-[44px] min-w-[44px] rounded-xl px-3 text-sm font-semibold transition-colors ${
              n === safePage
                ? "bg-primary-600 text-white"
                : "border border-border bg-surface text-dark hover:bg-surface"
            }`}
          >
            {n}
          </button>
        )
      )}

      <button
        onClick={() => handlePageChange(safePage + 1)}
        disabled={safePage === totalPages}
        aria-label="Next page"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-dark transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="ml-4 px-4 py-1 text-xs text-muted">
        Showing {showingFrom}&ndash;{showingTo} of {totalItems} universities
      </div>
    </nav>
  );
}
