"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, ExternalLink, Building2 } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { UNIVERSITY_PAGE_SIZE } from "@/lib/page-size";
import type { PublicUniversity } from "@/lib/data/public";

export function UniversitiesBrowser({ universities }: { universities: PublicUniversity[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return universities;
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.country.toLowerCase().includes(term) ||
        (u.city ?? "").toLowerCase().includes(term) ||
        u.programs.some((p) => p.toLowerCase().includes(term))
    );
  }, [universities, search]);

  // Narrowing the list while sitting on page 4 would otherwise show an empty
  // grid, so searching returns to page 1.
  const totalPages = Math.max(1, Math.ceil(filtered.length / UNIVERSITY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * UNIVERSITY_PAGE_SIZE;
  const visible = filtered.slice(start, start + UNIVERSITY_PAGE_SIZE);

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <label htmlFor="university-search" className="sr-only">
            Search universities by name, country, city, or subject
          </label>
          <input
            id="university-search"
            type="search"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Search universities by name, country, or subject..."
            className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-xs focus:border-primary-500 focus:outline-none"
          />
        </div>

        <p className="text-sm text-gray-600" role="status">
          <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "university" : "universities"}
          {filtered.length > 0 && (
            <span className="text-gray-500">
              {" "}
              &middot; showing {start + 1}&ndash;{Math.min(start + UNIVERSITY_PAGE_SIZE, filtered.length)}
            </span>
          )}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
          No published universities match your search yet.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((u) => {
            return (
              <div
                key={u.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {u.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
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
                      <span className="rounded-md bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 text-[11px] font-bold">
                        {u.scholarshipCount} Grants
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 leading-snug">{u.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-3">
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
                        <span className="font-semibold text-gray-900">Popular Programs: </span>
                        <span>{u.programs.slice(0, 3).join(", ")}</span>
                      </div>
                    )}
                    {u.internationalStudentPercent != null && (
                      <div>
                        <span className="font-semibold text-gray-900">Intl Students: </span>
                        <span>{u.internationalStudentPercent}% of student body</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <Link
                    href={`/scholarships?query=${encodeURIComponent(u.name)}`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 py-2.5 text-xs font-bold text-white hover:bg-primary-700 transition-colors"
                  >
                    <span>View Scholarships</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  {u.website && (
                    <a
                      href={u.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      title="Official Website"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
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
