"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, Filter } from "lucide-react";
import type { PublicCountryOption, PublicField } from "@/lib/data/public";
import { cn } from "@/lib/utils";

/**
 * The hero search. It holds only the three selected values and turns them into
 * a URL - the options themselves come from the server page as props, so no
 * filter list is requested from the browser.
 */
export function HomeSearchForm({
  countries,
  fields
}: {
  countries: PublicCountryOption[];
  fields: PublicField[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [destination, setDestination] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [intake, setIntake] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (studyLevel) params.set("degree", studyLevel);
    if (destination) params.set("country", destination);
    if (fieldOfStudy) params.set("field", fieldOfStudy);
    if (intake) params.set("intake", intake);
    router.push(`/scholarships?${params.toString()}`);
  };

  const intakes = [
    { value: "fall-2025", label: "Fall 2025 (September)" },
    { value: "spring-2026", label: "Spring 2026 (January)" },
    { value: "summer-2026", label: "Summer 2026 (May/June)" },
    { value: "fall-2026", label: "Fall 2026 (September)" },
  ];

  const studyLevels = [
    { value: "Undergraduate", label: "Undergraduate / Bachelor's" },
    { value: "Master's", label: "Master's / Postgraduate" },
    { value: "PhD", label: "PhD / Doctorate" },
    { value: "Postdoctoral", label: "Postdoctoral" },
  ];

  return (
    <form onSubmit={handleSearch} className="w-full">
      {/* Main Search Bar */}
      <div className="relative rounded-2xl border border-secondary-200 bg-white shadow-xl overflow-hidden">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="h-5 w-5 text-secondary-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search scholarships, universities, or countries..."
          className="w-full pl-12 pr-4 py-4 text-lg text-secondary-900 placeholder:text-secondary-400 bg-transparent focus:outline-none"
        />
      </div>

      {/* Filter Row */}
      <div className={cn("mt-3 transition-all duration-200", showFilters ? "opacity-100 max-h-96" : "opacity-0 max-h-0 overflow-hidden")}>
        <div className="rounded-2xl border border-secondary-200 bg-white p-3 sm:p-4 shadow-lg animate-slide-down">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Study Level */}
            <div>
              <label htmlFor="home-study-level" className="block text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-1 ml-1">
                Study Level
              </label>
              <select
                id="home-study-level"
                value={studyLevel}
                onChange={(e) => setStudyLevel(e.target.value)}
                className="w-full rounded-xl border border-secondary-200 bg-secondary-50/60 px-3 py-2.5 text-sm text-secondary-800 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none"
              >
                <option value="">All Levels</option>
                {studyLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div>
              <label htmlFor="home-destination" className="block text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-1 ml-1">
                Destination
              </label>
              <select
                id="home-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-xl border border-secondary-200 bg-secondary-50/60 px-3 py-2.5 text-sm text-secondary-800 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none"
              >
                <option value="">All Countries</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field of Study */}
            <div>
              <label htmlFor="home-field-study" className="block text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-1 ml-1">
                Field of Study
              </label>
              <select
                id="home-field-study"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                className="w-full rounded-xl border border-secondary-200 bg-secondary-50/60 px-3 py-2.5 text-sm text-secondary-800 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none"
              >
                <option value="">All Fields</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Intake */}
            <div>
              <label htmlFor="home-intake" className="block text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-1 ml-1">
                Intake
              </label>
              <select
                id="home-intake"
                value={intake}
                onChange={(e) => setIntake(e.target.value)}
                className="w-full rounded-xl border border-secondary-200 bg-secondary-50/60 px-3 py-2.5 text-sm text-secondary-800 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none"
              >
                <option value="">All Intakes</option>
                {intakes.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Row */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-secondary-100">
            <div className="flex items-center gap-2 text-xs text-secondary-500">
              <ShieldCheck className="h-4 w-4 text-success-600 shrink-0" />
              <span>Official & verified scholarship opportunities</span>
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-secondary-200 bg-white px-6 py-2.5 text-sm font-semibold text-secondary-700 shadow-sm transition-all hover:bg-secondary-50"
              >
                <Filter className="h-4 w-4" />
                <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
              >
                <Search className="h-4 w-4" />
                Search Scholarships
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <button
        type="button"
        onClick={() => setShowFilters(!showFilters)}
        className="w-full sm:hidden mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-secondary-200 bg-white px-6 py-2.5 text-sm font-semibold text-secondary-700 shadow-sm transition-all hover:bg-secondary-50"
      >
        <Filter className="h-4 w-4" />
        <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
      </button>
    </form>
  );
}
