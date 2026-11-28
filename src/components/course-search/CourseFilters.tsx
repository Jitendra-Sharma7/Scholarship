"use client";

import React, { useId } from "react";
import { Filter, RotateCcw, GraduationCap, BookOpen, Globe, Building2, Monitor, Clock, Euro, Layers } from "lucide-react";
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
    filters.degree ||
      filters.subject ||
      filters.country ||
      filters.university ||
      filters.studyMode ||
      filters.duration ||
      filters.tuitionFee ||
      filters.courseType,
  );

  const renderSelect = (
    label: string,
    name: keyof CourseFilterState,
    options: { value: string; label: string }[],
    Icon: React.ComponentType<{ className?: string }>,
    placeholder: string,
  ) => (
    <div className="space-y-2">
      <label
        htmlFor={controlId(name)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-500"
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </label>
      <select
        id={controlId(name)}
        value={filters[name]}
        onChange={(e) => handleSelect(name, e.target.value)}
        className="input-field"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  const degreeOptions = options.degrees.map((d) => ({ value: d.slug, label: d.label }));
  const subjectOptions = options.subjects.map((s) => ({ value: s.slug, label: s.name }));
  const countryOptions = [
    ...(options.regions.length > 0
      ? options.regions.map((r) => ({ value: r.slug, label: `${r.name} (Region)` }))
      : []),
    ...options.countries.map((c) => ({ value: c.slug, label: c.name })),
  ];
  const universityOptions = options.universities.map((u) => ({ value: u.id, label: u.name }));
  const studyModeOptions = options.studyModes.map((s) => ({ value: s.slug, label: s.label }));
  const durationOptions = options.durations.map((d) => ({ value: d.slug, label: d.label }));
  const tuitionFeeOptions = options.tuitionFees.map((t) => ({ value: t.slug, label: t.label }));
  const courseTypeOptions = options.courseTypes.map((c) => ({ value: c.slug, label: c.label }));

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

      {renderSelect("Degree", "degree", degreeOptions, GraduationCap, "All Degrees")}
      {renderSelect("Subject", "subject", subjectOptions, BookOpen, "All Subjects")}
      {renderSelect("Country / Region", "country", countryOptions, Globe, "All Countries")}
      {universityOptions.length > 0 && renderSelect("University", "university", universityOptions, Building2, "All Universities")}
      {studyModeOptions.length > 0 && renderSelect("Study Mode", "studyMode", studyModeOptions, Monitor, "All Study Modes")}
      {durationOptions.length > 0 && renderSelect("Duration", "duration", durationOptions, Clock, "All Durations")}
      {tuitionFeeOptions.length > 0 && renderSelect("Tuition Fee", "tuitionFee", tuitionFeeOptions, Euro, "All Fee Ranges")}
      {courseTypeOptions.length > 0 && renderSelect("Course Type", "courseType", courseTypeOptions, Layers, "All Types")}
    </div>
  );
}