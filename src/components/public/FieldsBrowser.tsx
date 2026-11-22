"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, RotateCcw, X } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { FIELD_PAGE_SIZE } from "@/lib/page-size";
import type { PublicField } from "@/lib/data/public";

/**
 * Ordered category taxonomy for the field tabs. Only categories that actually
 * appear on at least one published field are rendered, but they keep the
 * prescribed order so the UI matches the spec regardless of seed data drift.
 */
const CATEGORY_ORDER = [
  "All Categories",
  "Applied Sciences",
  "Arts & Design",
  "Business",
  "Health Sciences",
  "Natural Sciences",
  "Social Sciences",
  "STEM",
  "Technology",
] as const;

function orderedCategories(fields: PublicField[]): string[] {
  const present = new Set(
    fields
      .map((f) => f.category?.trim())
      .filter((c): c is string => Boolean(c)),
  );
  return ["All Categories", ...CATEGORY_ORDER.slice(1).filter((c) => present.has(c))];
}

interface TabProps {
  label: string;
  active: boolean;
  onSelect: () => void;
  "aria-controls": string;
  tabIndex: number;
  id: string;
}

function CategoryTab({ label, active, onSelect, "aria-controls": ariaControls, tabIndex, id }: TabProps) {
  return (
    <button
      id={id}
      role="tab"
      aria-controls={ariaControls}
      aria-selected={active}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`min-h-[44px] px-4 py-2 text-xs font-semibold capitalize transition-all duration-200 ease-out ${
        active
          ? "bg-primary-600 text-white shadow-sm"
          : "border border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900"
      } rounded-full`}
    >
      {label}
    </button>
  );
}

export function FieldsBrowser({ fields }: { fields: PublicField[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => orderedCategories(fields), [fields]);
  const tabListRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return fields.filter((f) => {
      const matchesSearch =
        !term ||
        f.name.toLowerCase().includes(term) ||
        (f.description ?? "").toLowerCase().includes(term);
      const matchesCategory = category === "all" || f.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [fields, search, category]);

  // Narrowing the list while sitting on page 2 would otherwise show an empty
  // grid, so search and filter changes return to page 1.
  const totalPages = Math.max(1, Math.ceil(filtered.length / FIELD_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * FIELD_PAGE_SIZE;
  const visible = filtered.slice(start, start + FIELD_PAGE_SIZE);

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearSearch = () => {
    setSearch("");
    setPage(1);
  };

  const changeCategory = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const handleTabKeydown = (e: React.KeyboardEvent) => {
    const tabs = tabListRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [];
    const current = document.activeElement as HTMLElement | null;
    if (!current) return;
    const index = tabs.length ? Array.from(tabs).indexOf(current) : -1;
    if (index === -1) return;
    const last = tabs.length - 1;
    let next = index;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next = index < last ? index + 1 : 0;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      next = index > 0 ? index - 1 : last;
    } else if (e.key === "Home") {
      e.preventDefault();
      next = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      next = last;
    }
    if (next !== index) {
      tabs[next]?.focus();
    }
  };

  const hasResults = filtered.length > 0;

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative w-full sm:w-96 max-w-2xl">
          <label htmlFor="field-search" className="sr-only">
            Search fields of study
          </label>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center pointer-events-none">
            <Search className="h-4 w-4 text-secondary-400" />
          </div>
          <input
            id="field-search"
            type="search"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.currentTarget.blur();
                clearSearch();
              }
            }}
            placeholder="Search field of study..."
            className="min-h-[48px] w-full rounded-xl border border-secondary-200 bg-white pl-12 pr-4 text-sm text-secondary-900 shadow-xs transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="text-sm text-secondary-600">
          <span className="font-semibold text-secondary-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "field of study" : "fields of study"}
          {hasResults && (
            <span className="text-secondary-400 font-normal">
              {" "}
              &middot; showing {start + 1}&ndash;{Math.min(start + FIELD_PAGE_SIZE, filtered.length)}
            </span>
          )}
        </p>
      </div>

      <div className="mb-8">
        <nav
          ref={tabListRef}
          role="tablist"
          aria-label="Field of study categories"
          onKeyDown={handleTabKeydown}
          className="flex gap-2 overflow-x-auto scrollbar-hide sm:overflow-visible pb-1"
        >
          {categories.map((cat, index) => {
            const active = category === cat;
            return (
              <CategoryTab
                key={cat}
                label={cat === "all" ? "All Categories" : cat}
                active={active}
                onSelect={() => {
                  changeCategory(cat);
                }}
                aria-controls="field-panel"
                tabIndex={active ? 0 : -1}
                id={`field-tab-${index}`}
              />
            );
          })}
        </nav>
      </div>

      {!hasResults ? (
        <div className="rounded-2xl border border-dashed border-secondary-300 bg-white p-16 text-center">
          <RotateCcw className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-base font-bold text-secondary-900 mb-2">
            No fields of study found
          </h3>
          <p className="text-sm text-secondary-500 max-w-sm mx-auto mb-6">
            We couldn&apos;t find any disciplines matching your search and
            category selection.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={clearSearch}
              className="inline-flex items-center gap-1.5 rounded-xl border border-secondary-200 bg-white px-5 py-2.5 text-sm font-semibold text-secondary-700 shadow-sm hover:bg-secondary-50"
            >
              <RotateCcw className="h-4 w-4" />
              Clear search
            </button>
            <Link
              href="/fields"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              Browse all fields
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {visible.map((f) => (
              <div
                key={f.id}
                className="flex flex-col h-full rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-secondary-300 hover:shadow-card-hover hover:-translate-y-1"
              >
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-[10px] font-bold text-primary-700 border border-primary-100 mb-4">
                      <span>{f.scholarshipCount}</span>
                      <span>Grants</span>
                    </div>

                    <Link
                      href={`/scholarships?field=${encodeURIComponent(f.id)}`}
                      className="group block"
                    >
                      <h3 className="text-lg font-bold text-secondary-900 leading-snug mb-2 group-hover:text-primary-600 transition-colors">
                        {f.name}
                      </h3>
                    </Link>

                    {f.category && (
                      <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-3">
                        {f.category}
                      </p>
                    )}

                    {f.description && (
                      <p className="text-sm text-secondary-600 leading-relaxed mb-5 line-clamp-3">
                        {f.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-6 border-t border-secondary-100 pt-4">
                      {f.careerPaths.length > 0 && (
                        <div className="flex items-start gap-1 text-xs text-secondary-600">
                          <span className="font-semibold text-secondary-900 shrink-0">
                            Career paths
                          </span>
                          <span className="truncate">
                            {f.careerPaths.slice(0, 4).join(", ")}
                          </span>
                        </div>
                      )}
                      {f.avgSalary && (
                        <div className="flex items-start gap-1 text-xs text-secondary-600">
                          <span className="font-semibold text-secondary-900 shrink-0">
                            Avg. salary
                          </span>
                          <span className="truncate">{f.avgSalary}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/scholarships?field=${encodeURIComponent(f.id)}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
                  >
                    <span>Browse {f.name} Scholarships</span>
                    <span className="h-3 w-3 flex items-center justify-center">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={setPage}
            label="Field of study pages"
          />
        </>
      )}
    </>
  );
}
