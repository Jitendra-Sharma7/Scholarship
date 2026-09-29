"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck } from "lucide-react";
import type { PublicCountryOption, PublicField } from "@/lib/data/public";

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
  const [studyField, setStudyField] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (studyField) params.set("field", studyField);
    if (degreeLevel) params.set("degree", degreeLevel);
    if (destinationCountry) params.set("country", destinationCountry);
    router.push(`/scholarships?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleHeroSearch}
      className="rounded-2xl border border-gray-200 bg-white p-3 shadow-xl sm:p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Field of Study */}
        <div>
          <label
            htmlFor="home-study-field"
            className="block text-xs font-semibold uppercase text-gray-500 mb-1 ml-1"
          >
            What do you want to study?
          </label>
          <select
            id="home-study-field"
            value={studyField}
            onChange={(e) => setStudyField(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-sm text-gray-800 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none"
          >
            <option value="">Any Field of Study</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Degree Level */}
        <div>
          <label
            htmlFor="home-degree-level"
            className="block text-xs font-semibold uppercase text-gray-500 mb-1 ml-1"
          >
            Study Level
          </label>
          <select
            id="home-degree-level"
            value={degreeLevel}
            onChange={(e) => setDegreeLevel(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-sm text-gray-800 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Degree Levels</option>
            <option value="Undergraduate">Undergraduate / Bachelor&apos;s</option>
            <option value="Master's">Master&apos;s / Postgraduate</option>
            <option value="PhD">PhD / Doctorate</option>
            <option value="Postdoctoral">Postdoctoral</option>
          </select>
        </div>

        {/* Destination Country */}
        <div>
          <label
            htmlFor="home-destination"
            className="block text-xs font-semibold uppercase text-gray-500 mb-1 ml-1"
          >
            Destination
          </label>
          <select
            id="home-destination"
            value={destinationCountry}
            onChange={(e) => setDestinationCountry(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-sm text-gray-800 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none"
          >
            <option value="">Any Destination Country</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Only official &amp; verified scholarship opportunities listed</span>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
        >
          <Search className="h-4 w-4" />
          Search Scholarships
        </button>
      </div>
    </form>
  );
}
