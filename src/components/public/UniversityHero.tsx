"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Trophy, GraduationCap, Award, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversitySearch } from "@/components/public/UniversitySearch";

interface HeroStat {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: boolean;
}

interface UniversityHeroProps {
  totalUniversities: number;
  countriesCount: number;
  rankedCount: number;
  scholarshipOpportunities: number;
  /** Initial search term from the server-rendered URL. */
  searchValue: string;
}

export function UniversityHero({
  totalUniversities,
  countriesCount,
  rankedCount,
  scholarshipOpportunities,
  searchValue,
}: UniversityHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchValue);

  // Always read the freshest params inside the debounced callback so a filter
  // changed in the directory during the debounce window is not lost.
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // Pending debounced navigation; cleared on unmount to avoid navigating after
  // the hero is gone.
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the local input in sync when the URL changes (e.g. back navigation,
  // or a filter change that re-renders the server component with a new q).
  useEffect(() => {
    setValue(searchValue);
  }, [searchValue]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const stats: HeroStat[] = useMemo(
    () => [
      {
        label: "Total Universities",
        value: totalUniversities.toLocaleString(),
        icon: GraduationCap,
        accent: true,
      },
      {
        label: "Countries Covered",
        value: countriesCount.toLocaleString(),
        icon: Globe,
      },
      {
        label: "Global Rankings",
        value: rankedCount.toLocaleString(),
        icon: Trophy,
      },
      {
        label: "Scholarship Opportunities",
        value: scholarshipOpportunities.toLocaleString(),
        icon: Award,
      },
    ],
    [totalUniversities, countriesCount, rankedCount, scholarshipOpportunities]
  );

  // Search runs entirely on the client: preserve every other filter already in
  // the URL, update only `q`, and reset pagination. This keeps the directory's
  // search/filter/sort/page state intact when the user types in the hero.
  //
  // The URL update is debounced: typing should not fire a server round-trip
  // (which re-runs the page's DB queries) on every keystroke. The input value
  // updates immediately for responsiveness; navigation happens after a pause.
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
      // Reset to the first page when the query changes.
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `/universities?${qs}` : "/universities", {
        scroll: false,
      });
    }, 350);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-100/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-secondary-100/40 blur-3xl" />

      <div className="relative px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 lg:mb-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-700 mb-4">
              <MapPin className="h-4 w-4" />
              Global Academic Directory
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-secondary-950 tracking-tight leading-tight">
              University Directory
            </h1>
            <p className="mt-4 text-lg text-secondary-600 max-w-2xl mx-auto leading-relaxed">
              Discover top universities worldwide and explore their
              scholarships, courses and admission information.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-3xl mx-auto mb-12 lg:mb-16">
            <UniversitySearch
              value={value}
              onChange={handleSearch}
              onClear={() => handleSearch("")}
            />
          </div>

          {/* Dynamic Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={cn(
                    "relative rounded-2xl border p-6 lg:p-8 text-center transition-all hover:shadow-card-hover hover:-translate-y-1",
                    stat.accent
                      ? "bg-gradient-to-br from-primary-600 to-primary-700 border-primary-500 text-white"
                      : "bg-white border-secondary-200 shadow-card"
                  )}
                >
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3",
                      stat.accent ? "bg-white/20" : "bg-primary-50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        stat.accent ? "text-white" : "text-primary-600"
                      )}
                    />
                  </div>
                  <div
                    className={cn(
                      "text-3xl lg:text-4xl font-extrabold mb-1",
                      stat.accent ? "text-white" : "text-secondary-950"
                    )}
                  >
                    {stat.value}
                  </div>
                  <div
                    className={cn(
                      "text-sm font-medium",
                      stat.accent ? "text-primary-100" : "text-secondary-500"
                    )}
                  >
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}