"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Globe, Award, Search, X } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface UniversityHeroProps {
  totalUniversities: number;
  countriesCount: number;
  scholarshipsCount: number;
  searchValue: string;
}

export function UniversityHero({
  totalUniversities,
  countriesCount,
  scholarshipsCount,
  searchValue,
}: UniversityHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchValue);
  const searchParamsRef = useRef(searchParams);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const handleSearch = (q: string) => {
    setValue(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      searchTimer.current = null;
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `/universities?${qs}` : "/universities", {
        scroll: false,
      });
    }, 350);
  };

  const handleClear = () => {
    setValue("");
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = null;
    const params = new URLSearchParams(searchParamsRef.current.toString());
    params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `/universities?${qs}` : "/universities", {
      scroll: false,
    });
  };

  const stats = useMemo(
    () => [
      { label: "Universities", value: totalUniversities, icon: GraduationCap },
      { label: "Countries", value: countriesCount, icon: Globe },
      { label: "Scholarships", value: scholarshipsCount, icon: Award },
    ],
    [totalUniversities, countriesCount, scholarshipsCount],
  );

  return (
    <section className="bg-[var(--gs-bg)]">
      <div className="mx-auto px-0 py-10 lg:py-16 font-onest">
        <div className="text-center mb-10 lg:mb-14">
          <h1
            className="text-[var(--gs-text)] font-bold leading-tight tracking-tight mb-4"
            style={{ fontSize: "clamp(28px, 4.2vw, 44px)" }}
          >
            University Directory
          </h1>
          <p className="text-[15px] leading-1.5 text-[var(--gs-muted)] max-w-[460px] mx-auto">
            Compare universities by ranking, tuition, intake and subject area.
            Explore real scholarship opportunities at each institution.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 gap-4 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="px-3">
                <div className="text-[var(--gs-text)] font-bold mb-1" style={{ fontSize: "clamp(20px, 3vw, 32px)" }}>
                  {formatNumber(stat.value)}
                </div>
                <div className="text-[12px] text-[var(--gs-muted)] uppercase tracking-wider">
                  {stat.label}
                </div>
                <div className="h-px w-6 mx-auto mt-3 bg-[var(--gs-border)] hidden sm:block" />
              </div>
          ))}
        </div>

        <div className="mt-10 lg:mt-14 max-w-[640px] mx-auto">
          <label className="sr-only">Search universities by name, country, city or subject</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--gs-muted)] shrink-0" />
            <input
              type="search"
              value={value}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder="Search universities by name, country, city or subject"
              aria-label="Search universities"
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-[14px] border border-[var(--gs-border)] bg-[var(--gs-surface)] pl-11 pr-9 py-3.5 text-[15px] leading-1.5 text-[var(--gs-text)] placeholder-[var(--gs-muted)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)] focus:ring-offset-2 focus:ring-offset-[var(--gs-bg)] disabled:cursor-not-allowed"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--gs-muted)] transition-colors hover:bg-[var(--gs-muted)]/10 hover:text-[var(--gs-text)] focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)] focus:ring-offset-2 focus:ring-offset-[var(--gs-bg)]"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
