"use client";

import React, { useId } from "react";
import { Filter, RotateCcw, Check } from "lucide-react";
import { CountryFlagWithName } from "@/components/ui/CountryFlag";
import type {
  PublicCountryOption,
  PublicField,
  PublicUniversity,
} from "@/lib/data/public";

interface FilterState {
  query: string;
  country: string;
  field: string;
  degree: string;
  funding: string;
  intake: string;
  status: string;
  eligibleNationality: string;
  applicationFee: string;
  university: string;
  sortBy: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  countries: PublicCountryOption[];
  fields: PublicField[];
  universities: PublicUniversity[];
  intakes: { id: string; name: string; slug: string }[];
}

export function SearchFilters({
  filters,
  onChange,
  onReset,
  countries,
  fields,
  universities,
  intakes
}: SearchFiltersProps) {
  const germany = countries.find((c) => c.id === "de");
  const computerScience = fields.find((f) => f.id === "cs");

  const degrees = [
    { value: "", label: "All Degree Levels" },
    { value: "Undergraduate", label: "Undergraduate / Bachelor's" },
    { value: "Master's", label: "Master's / Postgraduate" },
    { value: "PhD", label: "PhD / Doctoral" },
    { value: "Postdoctoral", label: "Postdoctoral" },
    { value: "Research", label: "Research Fellowships" },
  ];

  const fundingTypes = [
    { value: "", label: "All Funding Types" },
    { value: "fully-funded", label: "Fully Funded" },
    { value: "fully-tuition", label: "Full Tuition Coverage" },
    { value: "partial-tuition", label: "Partial Tuition Waiver" },
    { value: "stipend", label: "Monthly Stipend / Allowance" },
    { value: "mixed", label: "Mixed / Other" },
  ];

  const intakeOptions = [
    { value: "", label: "All Intakes" },
    ...intakes.map((i) => ({ value: i.slug, label: i.name })),
  ];

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "open", label: "Open" },
    { value: "upcoming", label: "Upcoming" },
    { value: "closing-soon", label: "Closing Soon" },
    { value: "closed", label: "Closed" },
    { value: "expired", label: "Expired" },
  ];

  const nationalityOptions = [
    { value: "", label: "All Nationalities" },
    { value: "international", label: "Open to International" },
    { value: "specific", label: "Specific Countries Only" },
  ];

  const applicationFeeOptions = [
    { value: "", label: "All Fees" },
    { value: "free", label: "Free ($0)" },
    { value: "paid", label: "Has Application Fee" },
  ];

  const sortOptions = [
    { value: "relevance", label: "Relevance / Match" },
    { value: "deadline", label: "Upcoming Deadline" },
    { value: "newest", label: "Recently Added" },
    { value: "alphabetical", label: "Alphabetical (A-Z)" },
    { value: "amount", label: "Scholarship Amount (High-Low)" },
    { value: "fully-funded", label: "Fully Funded First" },
  ];

  const handleSelect = (key: keyof FilterState, value: string) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const id = useId();
  const controlId = (name: string) => `${id}-filter-${name}`;

  const hasActiveFilters = Boolean(
    filters.query || filters.country || filters.field || filters.degree || 
    filters.funding || filters.intake || filters.status || 
    filters.eligibleNationality || filters.applicationFee || filters.university || filters.sortBy
  );

  return (
    <div className="space-y-6 rounded-2xl border border-secondary-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between border-b border-secondary-100 pb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary-600" />
          <h2 className="font-semibold text-secondary-900">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-medium text-secondary-500 hover:text-primary-600"
          >
            <RotateCcw className="h-3 w-3" />
            Reset all
          </button>
        )}
      </div>

      {/* Search Query */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("query")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Search Keywords
        </label>
        <input
          id={controlId("query")}
          type="text"
          value={filters.query}
          onChange={(e) => handleSelect("query", e.target.value)}
          placeholder="e.g., Chevening, DAAD, Computer Science..."
          className="input-field"
        />
      </div>

      {/* Degree Level */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("degree")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Study Level
        </label>
        <select
          id={controlId("degree")}
          value={filters.degree}
          onChange={(e) => handleSelect("degree", e.target.value)}
          className="input-field"
        >
          {degrees.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Destination Country */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("country")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Destination Country
        </label>
        <select
          id={controlId("country")}
          value={filters.country}
          onChange={(e) => handleSelect("country", e.target.value)}
          className="input-field"
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
      <div className="space-y-2">
        <label
          htmlFor={controlId("field")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Field of Study
        </label>
        <select
          id={controlId("field")}
          value={filters.field}
          onChange={(e) => handleSelect("field", e.target.value)}
          className="input-field"
        >
          <option value="">All Fields</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* University */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("university")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          University
        </label>
        <select
          id={controlId("university")}
          value={filters.university}
          onChange={(e) => handleSelect("university", e.target.value)}
          className="input-field"
        >
          <option value="">All Universities</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* Intake */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("intake")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Academic Intake
        </label>
        <select
          id={controlId("intake")}
          value={filters.intake}
          onChange={(e) => handleSelect("intake", e.target.value)}
          className="input-field"
        >
          {intakeOptions.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      </div>

      {/* Funding Type */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("funding")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Funding Coverage
        </label>
        <select
          id={controlId("funding")}
          value={filters.funding}
          onChange={(e) => handleSelect("funding", e.target.value)}
          className="input-field"
        >
          {fundingTypes.map((ft) => (
            <option key={ft.value} value={ft.value}>
              {ft.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("status")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Application Status
        </label>
        <select
          id={controlId("status")}
          value={filters.status}
          onChange={(e) => handleSelect("status", e.target.value)}
          className="input-field"
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Eligible Nationality */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("eligibleNationality")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Eligible Nationality
        </label>
        <select
          id={controlId("eligibleNationality")}
          value={filters.eligibleNationality}
          onChange={(e) => handleSelect("eligibleNationality", e.target.value)}
          className="input-field"
        >
          {nationalityOptions.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>
      </div>

      {/* Application Fee */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("applicationFee")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Application Fee
        </label>
        <select
          id={controlId("applicationFee")}
          value={filters.applicationFee}
          onChange={(e) => handleSelect("applicationFee", e.target.value)}
          className="input-field"
        >
          {applicationFeeOptions.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("sortBy")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Sort By
        </label>
        <select
          id={controlId("sortBy")}
          value={filters.sortBy}
          onChange={(e) => handleSelect("sortBy", e.target.value)}
          className="input-field"
        >
          {sortOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Quick shortcuts */}
      <div className="border-t border-secondary-100 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-500">
          Popular filters
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleSelect("funding", "fully-funded")}
            aria-pressed={filters.funding === "fully-funded"}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
              filters.funding === "fully-funded"
                ? "border-primary-500 bg-primary-50 font-medium text-primary-700"
                : "border-secondary-200 bg-secondary-50 text-secondary-600 hover:bg-secondary-100"
            }`}
          >
            <Check className="h-3 w-3" />
            Fully Funded
          </button>
          <button
            onClick={() => handleSelect("degree", "Master's")}
            aria-pressed={filters.degree === "Master's"}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
              filters.degree === "Master's"
                ? "border-primary-500 bg-primary-50 font-medium text-primary-700"
                : "border-secondary-200 bg-secondary-50 text-secondary-600 hover:bg-secondary-100"
            }`}
          >
            <Check className="h-3 w-3" />
            Master&apos;s
          </button>
          {germany && (
            <button
              onClick={() => handleSelect("country", germany.id)}
              aria-pressed={filters.country === germany.id}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                filters.country === germany.id
                  ? "border-primary-500 bg-primary-50 font-medium text-primary-700"
                  : "border-secondary-200 bg-secondary-50 text-secondary-600 hover:bg-secondary-100"
              }`}
            >
              <Check className="h-3 w-3" />
              <CountryFlagWithName
                code={germany.code}
                name={germany.name}
                size="xs"
              />
            </button>
          )}
          {computerScience && (
            <button
              onClick={() => handleSelect("field", computerScience.id)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                filters.field === computerScience.id
                  ? "border-primary-500 bg-primary-50 font-medium text-primary-700"
                  : "border-secondary-200 bg-secondary-50 text-secondary-600 hover:bg-secondary-100"
              }`}
            >
              <Check className="h-3 w-3" />
              Computer Science
            </button>
          )}
        </div>
      </div>
    </div>
  );
}