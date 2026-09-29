"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { Pagination } from "@/components/ui/Pagination";
import { COUNTRY_PAGE_SIZE } from "@/lib/page-size";
import type { PublicCountryCard } from "@/lib/data/public";

const PER_PAGE = COUNTRY_PAGE_SIZE;

function uniqueRegions(countries: PublicCountryCard[]): string[] {
  return Array.from(
    new Set(
      countries
        .map((c) => c.region?.trim())
        .filter((r): r is string => Boolean(r)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function CountriesBrowser({ countries }: { countries: PublicCountryCard[] }) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [page, setPage] = useState(1);

  const regions = useMemo(() => uniqueRegions(countries), [countries]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return countries.filter((c) => {
      const matchesSearch =
        !term ||
        c.name.toLowerCase().includes(term) ||
        (c.capital ?? "").toLowerCase().includes(term);
      const matchesRegion = region === "all" || c.region === region;
      return matchesSearch && matchesRegion;
    });
  }, [countries, search, region]);

  // Narrowing the list while sitting on page 7 would otherwise show an empty
  // grid, so search and filter changes return to page 1 in their own handler.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const visible = filtered.slice(start, start + PER_PAGE);

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const changeRegion = (value: string) => {
    setRegion(value);
    setPage(1);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <label htmlFor="country-search" className="sr-only">
            Search countries by name or capital
          </label>
          <input
            id="country-search"
            type="search"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Search countries or capitals..."
            className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-xs focus:border-primary-500 focus:outline-none"
          />
        </div>

        <p className="text-sm text-gray-600" role="status">
          <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "country" : "countries"}
          {filtered.length > 0 && (
            <span className="text-gray-500">
              {" "}
              &middot; showing {start + 1}&ndash;{Math.min(start + PER_PAGE, filtered.length)}
            </span>
          )}
        </p>
      </div>

      {regions.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {["all", ...regions].map((reg) => (
            <button
              key={reg}
              onClick={() => changeRegion(reg)}
              aria-pressed={region === reg}
              className={`min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                region === reg
                  ? "bg-primary-600 text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {reg === "all" ? "All Regions" : reg}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
          No published countries match your search yet.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <CountryFlag code={c.code} name={c.name} size="xl" className="shadow-sm" />
                    <span className="shrink-0 rounded-full border border-primary-100 bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">
                      {c.scholarshipCount} opportunities
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">{c.name}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-gray-500">
                    {c.capital ? `${c.capital} \u00b7 ` : ""}
                    {c.region}
                  </p>

                  {c.description ? (
                    <p className="mb-4 mt-3 line-clamp-3 text-xs leading-relaxed text-gray-600">
                      {c.description}
                    </p>
                  ) : null}

                  {(c.currency || c.popularUniversities.length > 0) && (
                    <div className="space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-600">
                      {c.currency && (
                        <div>
                          <span className="font-semibold text-gray-900">Currency: </span>
                          <span>{c.currency}</span>
                        </div>
                      )}
                      {c.popularUniversities.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-900">Top Universities: </span>
                          <span>{c.popularUniversities.slice(0, 2).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  href={`/scholarships?country=${encodeURIComponent(c.id)}`}
                  className="mt-6 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-50"
                >
                  <span>Browse {c.name} Scholarships</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            label="Country list pages"
          />
        </>
      )}
    </>
  );
}
