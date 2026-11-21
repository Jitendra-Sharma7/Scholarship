"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Globe, Trophy, GraduationCap, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversitySearch } from "@/components/public/UniversitySearch";

interface HeroStat {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: boolean;
}

interface DirectoryHeroProps {
  totalUniversities: number;
  countriesCount: number;
  rankedCount: number;
  scholarshipOpportunities: number;
  /** Initial search term from the server-rendered URL. */
  searchValue: string;
}

export function DirectoryHero({
  totalUniversities,
  countriesCount,
  rankedCount,
  scholarshipOpportunities,
  searchValue,
}: DirectoryHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchValue);
  const [isFocused, setIsFocused] = useState(false);

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

  const stats: HeroStat[] = [
    {
      label: "Universities",
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
  ];

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
    handleSearch("");
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-light via-surface to-secondary-50">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-100/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-secondary-100/40 blur-3xl pointer-events-none" />

      <div className="relative px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 lg:mb-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-semibold text-primary-dark mb-4">
              <MapPin className="h-4 w-4" />
              Global Academic Directory
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark tracking-tight leading-tight">
              Discover universities around the world
            </h1>
            <p className="mt-4 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
              Explore top universities, compare opportunities, and find the
              perfect place to achieve your academic goals.
            </p>
          </div>

          <div className="max-w-3xl mx-auto mb-12 lg:mb-16">
            <UniversitySearch
              value={value}
              onChange={handleSearch}
              onClear={handleClear}
              isFocused={isFocused}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={cn(
                    "relative rounded-xl border p-6 lg:p-8 text-center",
                    stat.accent
                      ? "bg-gradient-to-br from-primary-600 to-primary-700 border-primary-600 text-white"
                      : "bg-surface border-border shadow-card"
                  )}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3">
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        stat.accent ? "text-white" : "text-primary-600"
                      )}
                    />
                  </div>
                  <div className={cn("text-3xl lg:text-4xl font-bold mb-1", stat.accent ? "text-white" : "text-dark")}>
                    {stat.value}
                  </div>
                  <div className={cn("text-sm font-medium", stat.accent ? "text-primary-100" : "text-muted")}>
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
