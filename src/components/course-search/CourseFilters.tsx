"use client";

import React, { useId } from "react";
import { Filter, RotateCcw } from "lucide-react";
import type { CourseFilterState, CourseSearchOptions } from "@/lib/course-search";

interface CourseFiltersProps {
  filters: CourseFilterState;
  options: CourseSearchOptions;
  onChange: (next: CourseFilterState) => void;
  onReset: () => void;
}

export function CourseFilters({
  filters,
  options,
  onChange,
  onReset,
}: CourseFiltersProps) {
  const id = useId();
  const controlId = (name: string) => `${id}-course-filter-${name}`;

  const handleSelect = (key: keyof CourseFilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Boolean(
    filters.degree || filters.subject || filters.country || filters.university,
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

      {/* Degree */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("degree")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Degree
        </label>
        <select
          id={controlId("degree")}
          value={filters.degree}
          onChange={(e) => handleSelect("degree", e.target.value)}
          className="input-field"
        >
          <option value="">All Degrees</option>
          {options.degrees.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("subject")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Subject
        </label>
        <select
          id={controlId("subject")}
          value={filters.subject}
          onChange={(e) => handleSelect("subject", e.target.value)}
          className="input-field"
        >
          <option value="">All Subjects</option>
          {options.subjects.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Country / Region */}
      <div className="space-y-2">
        <label
          htmlFor={controlId("country")}
          className="text-xs font-semibold uppercase tracking-wider text-secondary-500"
        >
          Country / Region
        </label>
        <select
          id={controlId("country")}
          value={filters.country}
          onChange={(e) => handleSelect("country", e.target.value)}
          className="input-field"
        >
          <option value="">All Countries</option>
          {options.regions.length > 0 && (
            <optgroup label="Regions">
              {options.regions.map((r) => (
                <option key={`region-${r.slug}`} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="Countries">
            {options.countries.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* University */}
      {options.universities.length > 0 && (
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
            {options.universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}