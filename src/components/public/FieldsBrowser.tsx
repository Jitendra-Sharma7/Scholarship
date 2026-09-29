"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { FIELD_PAGE_SIZE } from "@/lib/page-size";
import type { PublicField } from "@/lib/data/public";

function uniqueCategories(fields: PublicField[]): string[] {
  return Array.from(
    new Set(
      fields
        .map((f) => f.category?.trim())
        .filter((c): c is string => Boolean(c)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function FieldsBrowser({ fields }: { fields: PublicField[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => uniqueCategories(fields), [fields]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return fields.filter((f) => {
      const matchesSearch = !term || f.name.toLowerCase().includes(term);
      const matchesCategory = category === "all" || f.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [fields, search, category]);

  // Narrowing the list while sitting on page 2 would otherwise show an empty
  // grid, so search and filter changes return to page 1.
  const totalPages = Math.max(1, Math.ceil(filtered.length / FIELD_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * FIELD_PAGE_SIZE;
  const visible = filtered.slice(start, start + FIELD_PAGE_SIZE);

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const changeCategory = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <label htmlFor="field-search" className="sr-only">
            Search fields of study
          </label>
          <input
            id="field-search"
            type="search"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Search field of study..."
            className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-xs focus:border-primary-500 focus:outline-none"
          />
        </div>

        <p className="text-sm text-gray-600" role="status">
          <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "field" : "fields"}
          {filtered.length > 0 && (
            <span className="text-gray-500">
              {" "}
              &middot; showing {start + 1}&ndash;{Math.min(start + FIELD_PAGE_SIZE, filtered.length)}
            </span>
          )}
        </p>
      </div>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {["all", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => changeCategory(cat)}
              aria-pressed={category === cat}
              className={`min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                category === cat
                  ? "bg-primary-600 text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
          No published fields of study match your search yet.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((f) => (
            <div
              key={f.id}
              className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full bg-primary-50 text-primary-700 font-bold px-2.5 py-1 text-xs border border-primary-100">
                    {f.scholarshipCount} Grants
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900">{f.name}</h3>
                {f.category && (
                  <p className="text-xs font-semibold text-primary-600 mb-3">{f.category}</p>
                )}

                {f.description ? (
                  <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-3">
                    {f.description}
                  </p>
                ) : null}

                <div className="space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-600">
                  {f.careerPaths.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-900">Career Paths: </span>
                      <span>{f.careerPaths.slice(0, 3).join(", ")}</span>
                    </div>
                  )}
                  {f.avgSalary && (
                    <div>
                      <span className="font-semibold text-gray-900">Avg Salary: </span>
                      <span>{f.avgSalary}</span>
                    </div>
                  )}
                </div>
              </div>

              <Link
                href={`/scholarships?field=${encodeURIComponent(f.id)}`}
                className="mt-6 flex items-center justify-center gap-1.5 rounded-xl bg-gray-50 py-2.5 text-xs font-bold text-primary-700 border border-gray-200 hover:bg-primary-50 transition-colors"
              >
                <span>Browse {f.name} Scholarships →</span>
              </Link>
            </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            label="Field list pages"
          />
        </>
      )}
    </>
  );
}
