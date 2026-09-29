"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Page navigation for the client-side browsed directories.
 *
 * The lists are filtered in the browser, so the page is local state rather than
 * a URL. Callers are responsible for resetting `page` to 1 whenever the query
 * that produced the list changes.
 */

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

export function Pagination({
  page,
  totalPages,
  onChange,
  /** Names the region being paginated, e.g. "country list pages". */
  label,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  label: string;
}) {
  // A narrowed list can have fewer pages than the one being displayed, so the
  // controls never act on a page that no longer exists.
  const safePage = Math.min(Math.max(page, 1), totalPages);
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={label} className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      <button
        onClick={() => onChange(safePage - 1)}
        disabled={safePage === 1}
        aria-label="Previous page"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pageWindow(safePage, totalPages).map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} className="px-1.5 text-sm text-gray-400" aria-hidden="true">
            &hellip;
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-current={n === safePage ? "page" : undefined}
            className={`min-h-[44px] min-w-[44px] rounded-xl px-3 text-sm font-semibold transition-colors ${
              n === safePage
                ? "bg-primary-600 text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {n}
          </button>
        )
      )}

      <button
        onClick={() => onChange(safePage + 1)}
        disabled={safePage === totalPages}
        aria-label="Next page"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
