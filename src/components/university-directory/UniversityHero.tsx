"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { GraduationCap, Award, Search, X, BookOpen } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface UniversityHeroProps {
  totalUniversities: number;
  totalCourses: number;
  totalScholarships: number;
  searchValue: string;
}

export function UniversityHero({
  totalUniversities,
  totalCourses,
  totalScholarships,
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
      { label: "Total Universities", value: totalUniversities, icon: GraduationCap },
      { label: "Total Courses", value: totalCourses, icon: BookOpen },
      { label: "Total Scholarships", value: totalScholarships, icon: Award },
    ],
    [totalUniversities, totalCourses, totalScholarships],
  );

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "#F3F7FF" }}
    >
      {/* Premium blue gradient + campus background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#1747D1] via-[#102B63] to-[#0f1b3d]"
        />
        <Image
          fill
          src="https://images.unsplash.com/photo-1523050856040-6ca556cf8789?w=1920&q=85"
          alt="University campus"
          priority
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover"
          sizes="100vw"
          style={{
            opacity: 0.42,
            mixBlendMode: "multiply",
          }}
        />
        <div className="absolute inset-0 bg-[#102B63]/35" />
      </div>

      <div className="relative z-10 mx-auto px-5 py-12 lg:px-8 lg:py-20 font-onest">
        <div className="text-center mb-12 lg:mb-16">
          <h1
            className="text-white font-bold leading-tight tracking-tight mb-4"
            style={{ fontSize: "clamp(30px, 4.6vw, 48px)" }}
          >
            University Directory
          </h1>
          <p className="text-[#d7e3ff] leading-1.6 text-[15px] max-w-[520px] mx-auto opacity-90">
            Compare universities by ranking, tuition, intake and subject area.
            Explore real scholarship opportunities at each institution, with data
            drawn directly from our published listings.
          </p>
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 gap-6 mb-14 lg:mb-16">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#E2E8F0]/30 bg-[#FFFFFF]/10 px-5 py-6 backdrop-blur-sm text-center shadow-sm"
            >
              <div
                className="text-[#1747D1] font-extrabold mb-1.5"
                style={{ fontSize: "clamp(24px, 4vw, 36px)" }}
              >
                {formatNumber(stat.value)}
              </div>
              <div className="text-[#d7e3ff] text-[12px] uppercase tracking-wider font-medium opacity-90">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className="mt-12 lg:mt-16 max-w-[640px] mx-auto">
          <label className="sr-only">Search universities by name, country, city or subject</label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#d7e3ff] shrink-0">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="search"
              value={value}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder="Search universities by name, country, city or subject"
              aria-label="Search universities"
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-full border border-[#d7e3ff]/50 bg-[#FFFFFF]/15 pl-14 pr-10 py-4 text-[15px] leading-1.5 text-white placeholder-[#9db2e8]/80 transition-all focus:outline-none focus:ring-2 focus:ring-[#1747D1] focus:ring-offset-2 focus:ring-offset-[#0f1b3d]"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#d7e3ff] transition-colors hover:bg-[#FFFFFF]/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1747D1] focus:ring-offset-2 focus:ring-offset-[#0f1b3d]"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-4 text-[12px] text-[#9db2e8] text-center opacity-90">
            Search by university name, country, city, course or subject area.
          </p>
        </div>
      </div>
    </section>
  );
}
