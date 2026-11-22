"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Award, Search, X, BookOpen, Globe, MapPin, Filter } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface UniversityHeroProps {
  totalUniversities: number;
  totalCourses: number;
  totalScholarships: number;
  searchValue: string;
}

const SEARCH_SUGGESTIONS = [
  "Computer Science",
  "Engineering",
  "Business Administration",
  "Medicine",
  "Data Science",
  "Artificial Intelligence",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Germany",
  "London",
  "New York",
  "Toronto",
  "Sydney",
  "Berlin",
  "Undergraduate",
  "Master's",
  "PhD",
];

export function UniversityHero({
  totalUniversities,
  totalCourses,
  totalScholarships,
  searchValue,
}: UniversityHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchParamsRef = useRef(searchParams);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setShowSuggestions(false);
    setFocusedIndex(-1);
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
    }, 300);
  };

  const handleClear = () => {
    setValue("");
    setShowSuggestions(false);
    setFocusedIndex(-1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = null;
    const params = new URLSearchParams(searchParamsRef.current.toString());
    params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `/universities?${qs}` : "/universities", {
      scroll: false,
    });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const suggestions = getFilteredSuggestions();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && suggestions[focusedIndex]) {
        handleSearch(suggestions[focusedIndex]);
      } else {
        e.currentTarget.blur();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setFocusedIndex(-1);
      e.currentTarget.blur();
    }
  };

  const handleFocus = () => {
    if (value.length > 0 || showSuggestions) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const getFilteredSuggestions = () => {
    if (!value.trim()) return SEARCH_SUGGESTIONS.slice(0, 8);
    const lower = value.toLowerCase();
    return SEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().includes(lower)).slice(0, 8);
  };

  const stats = useMemo(
    () => [
      { label: "Universities", value: totalUniversities, icon: GraduationCap, filterKey: "category", filterValue: "all" },
      { label: "Courses", value: totalCourses, icon: BookOpen, filterKey: "field", filterValue: "all" },
      { label: "Scholarships", value: totalScholarships, icon: Award, filterKey: "scholarships", filterValue: "with" },
    ],
    [totalUniversities, totalCourses, totalScholarships],
  );

  const handleStatClick = (filterKey: string, filterValue: string) => {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    if (filterValue !== "all") {
      params.set(filterKey, filterValue);
    } else {
      params.delete(filterKey);
    }
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `/universities?${qs}` : "/universities", {
      scroll: false,
    });
  };

  return (
<section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1b3d] via-[#102B63] to-[#1747D1]">
      {/* Subtle abstract decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/2 w-[500px] h-[500px] rounded-full bg-[#1747D1]/10 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-white/3 blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] rounded-full bg-[#1747D1]/5 blur-2xl" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\' fill=\'%23ffffff\' fill-opacity=\'0.02\'/%3E%3C/g%3E%3C/svg%3E")' }} />
      </div>

      <div className="relative z-10 mx-auto px-5 py-10 lg:px-8 lg:py-14 font-onest">
        <div className="text-center mb-8 lg:mb-12">
          <h1
            className="text-white font-bold leading-tight tracking-tight mb-3"
            style={{ fontSize: "clamp(26px, 4vw, 40px)" }}
          >
            University Directory
          </h1>
          <p className="text-[#d7e3ff] leading-1.5 text-[14px] max-w-[480px] mx-auto opacity-90">
            Compare universities, courses, fees & scholarships worldwide.
          </p>
        </div>

        {/* Statistics cards - compact and clickable */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 gap-4 mb-8 lg:mb-10">
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() => handleStatClick(stat.filterKey, stat.filterValue)}
              className="relative rounded-xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm text-center transition-all hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#1747D1] focus:ring-offset-2 focus:ring-offset-[#0f1b3d]"
              aria-label={`Filter by ${stat.label}`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <stat.icon className="h-5 w-5 text-[#1747D1]" aria-hidden="true" />
              </div>
              <div
                className="text-white font-extrabold"
                style={{ fontSize: "clamp(22px, 3.5vw, 32px)" }}
              >
                {formatNumber(stat.value)}
              </div>
              <div className="text-[#d7e3ff] text-[11px] uppercase tracking-wider font-medium opacity-90 mt-1">
                {stat.label}
              </div>
              {/* Subtle click indicator */}
              <div className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-[#1747D1]/50 opacity-0 transition-opacity hover:opacity-100" />
            </button>
          ))}
        </div>

        {/* Search bar with suggestions */}
        <div className="mt-8 lg:mt-12 max-w-[680px] mx-auto">
          <label className="sr-only">Search universities by name, country, city, course or subject</label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#d7e3ff] shrink-0">
              <Search className="h-5 w-5" />
            </div>
            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setShowSuggestions(true);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Search university, country, city, course, subject or level..."
              aria-label="Search universities"
              aria-autocomplete="list"
              aria-controls="search-suggestions"
              aria-expanded={showSuggestions && getFilteredSuggestions().length > 0}
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-full border border-[#d7e3ff]/50 bg-white/10 pl-14 pr-14 py-4.5 text-[15px] leading-1.5 text-white placeholder-[#9db2e8]/80 transition-all focus:outline-none focus:ring-2 focus:ring-[#1747D1] focus:ring-offset-2 focus:ring-offset-[#0f1b3d] focus:border-transparent"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#d7e3ff] transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1747D1] focus:ring-offset-2 focus:ring-offset-[#0f1b3d]"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {/* Search hint icons */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] text-[#9db2e8]/60 hidden sm:flex">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5">
                <Globe className="h-3 w-3" />
                Country
              </span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5">
                <MapPin className="h-3 w-3" />
                City
              </span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5">
                <BookOpen className="h-3 w-3" />
                Course
              </span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5">
                <Filter className="h-3 w-3" />
                Level
              </span>
            </div>
          </div>

          {/* Search suggestions dropdown */}
          {showSuggestions && getFilteredSuggestions().length > 0 && (
            <div
              id="search-suggestions"
              className="mt-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg overflow-hidden animate-fade-in"
              role="listbox"
            >
              {getFilteredSuggestions().map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  role="option"
                  aria-selected={index === focusedIndex}
                  className={`w-full px-5 py-3 text-left text-[14px] text-white transition-colors ${
                    index === focusedIndex
                      ? "bg-[#1747D1]/30"
                      : "hover:bg-white/5"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <p className="mt-3 text-[12px] text-[#9db2e8] text-center opacity-90 hidden sm:block">
            Search by university name, country, city, course, subject or study level
          </p>
          <p className="mt-2 text-[12px] text-[#9db2e8] text-center opacity-90 sm:hidden">
            Search: university, country, city, course, subject, level
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 150ms ease-out;
        }
      `}</style>
    </section>
  );
}