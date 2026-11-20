"use client";

import { useMemo } from "react";
import { Search, Globe, Trophy, GraduationCap, Award, MapPin, Star, Building2 } from "lucide-react";
import { UniversityImage } from "@/components/public/UniversityImage";
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
  onSearch: (q: string) => void;
  searchValue: string;
}

export function UniversityHero({
  totalUniversities,
  countriesCount,
  rankedCount,
  scholarshipOpportunities,
  onSearch,
  searchValue,
}: UniversityHeroProps) {
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
              Discover top universities worldwide and explore their scholarships, courses and admission information.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-3xl mx-auto mb-12 lg:mb-16">
            <UniversitySearch
              value={searchValue}
              onChange={onSearch}
              onClear={() => onSearch("")}
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
                      stat.accent
                        ? "bg-white/20"
                        : "bg-primary-50"
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

function cn(...inputs: (string | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}