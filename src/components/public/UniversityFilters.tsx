"use client";

import { useState } from "react";
import { ChevronDown, Filter, Globe, Trophy, Users, GraduationCap, Award, MapPin, Shield, Clock, DollarSign, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface UniversityFiltersProps {
  countries: { id: string; name: string }[];
  types: string[];
  fields: string[];
  intakes: { id: string; name: string; slug: string }[];
  studyLevels: { value: string; label: string }[];
  values: {
    country: string;
    ranking: string;
    studyLevel: string;
    scholarships: string;
    field: string;
    type: string;
    intake: string;
    tuitionRange: string;
  };
  onFilterChange: (patch: Partial<UniversityFiltersProps["values"]>) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

const RANKING_FILTERS = [
  { value: "all", label: "All rankings" },
  { value: "top10", label: "Top 10" },
  { value: "top50", label: "Top 50" },
  { value: "top100", label: "Top 100" },
  { value: "top500", label: "Top 500" },
  { value: "unranked", label: "Unranked" },
] as const;

const SCHOLARSHIP_FILTERS = [
  { value: "all", label: "All" },
  { value: "with", label: "With scholarships" },
  { value: "without", label: "Without scholarships" },
] as const;

const TUITION_RANGE_FILTERS = [
  { value: "all", label: "All tuition ranges" },
  { value: "free", label: "Free / No tuition" },
  { value: "low", label: "Low (under $10k)" },
  { value: "medium", label: "Moderate ($10k - $30k)" },
  { value: "high", label: "High ($30k+)" },
] as const;

export function UniversityFilters({
  countries,
  types,
  fields,
  intakes,
  studyLevels,
  values,
  onFilterChange,
  onClearAll,
  hasActiveFilters,
}: UniversityFiltersProps) {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeFilterCount = Object.values(values).filter(
    (v) => v !== "all" && v !== ""
  ).length;

  const sections = [
    {
      key: "country",
      label: "Country",
      icon: <Globe className="h-4 w-4" />,
      options: countries.map((c) => ({ value: c.name, label: c.name })),
      value: values.country,
      placeholder: "All countries",
    },
    {
      key: "ranking",
      label: "University Ranking",
      icon: <Trophy className="h-4 w-4" />,
      options: RANKING_FILTERS,
      value: values.ranking,
      placeholder: "All rankings",
    },
    {
      key: "studyLevel",
      label: "Study Level",
      icon: <GraduationCap className="h-4 w-4" />,
      options: studyLevels,
      value: values.studyLevel,
      placeholder: "All levels",
    },
    {
      key: "scholarships",
      label: "Available Scholarships",
      icon: <Award className="h-4 w-4" />,
      options: SCHOLARSHIP_FILTERS,
      value: values.scholarships,
      placeholder: "All",
    },
    {
      key: "field",
      label: "Course / Subject Area",
      icon: <MapPin className="h-4 w-4" />,
      options: fields.map((f) => ({ value: f, label: f })),
      value: values.field,
      placeholder: "All subjects",
    },
    {
      key: "type",
      label: "University Type",
      icon: <Shield className="h-4 w-4" />,
      options: types.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
      value: values.type,
      placeholder: "All types",
    },
    {
      key: "intake",
      label: "Intake",
      icon: <Clock className="h-4 w-4" />,
      options: intakes.map((i) => ({ value: i.slug, label: i.name })),
      value: values.intake,
      placeholder: "All intakes",
    },
    {
      key: "tuitionRange",
      label: "Tuition Fee Range",
      icon: <DollarSign className="h-4 w-4" />,
      options: TUITION_RANGE_FILTERS,
      value: values.tuitionRange,
      placeholder: "All tuition ranges",
    },
  ];

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="w-full justify-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-100 px-1.5 text-[10px] font-bold text-primary-700">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile filter drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-secondary-900/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-secondary-200 px-4 py-4">
                <h2 className="text-lg font-bold text-secondary-900">Filters</h2>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {sections.map((section) => (
                  <div key={section.key}>
                    <div className="flex items-center gap-2 mb-2">
                      {section.icon}
                      <span className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
                        {section.label}
                      </span>
                    </div>
                    <div className="relative">
                      <select
                        value={section.value}
                        onChange={(e) =>
                          onFilterChange({ [section.key]: e.target.value })
                        }
                        className="min-h-[42px] w-full appearance-none rounded-lg border border-secondary-300 bg-white pl-3 pr-9 py-2 text-sm text-secondary-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                      >
                        <option value="all">{section.placeholder}</option>
                        {section.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400 pointer-events-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-secondary-200 p-4 flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAll}
                  disabled={!hasActiveFilters}
                  className="flex-1"
                >
                  Clear all
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1"
                >
                  Show results
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop filters */}
      <div className="hidden lg:block rounded-xl border border-secondary-200 bg-white shadow-card">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-t-xl border-b border-b-secondary-200 bg-secondary-50/50 px-5 py-3.5 text-left transition-colors hover:bg-secondary-100",
            !expanded && "rounded-b-xl"
          )}
          aria-expanded={expanded}
          aria-controls="university-filters-panel"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-secondary-500" />
            <span className="font-semibold text-secondary-900">Filters</span>
            {hasActiveFilters && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-100 px-1.5 text-[10px] font-bold text-primary-700">
                {activeFilterCount}
              </span>
            )}
          </div>
          <ChevronDown
            className={cn("h-4 w-4 text-secondary-400 transition-transform", expanded && "rotate-180")}
          />
        </button>

        {expanded && (
          <div id="university-filters-panel" className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((section) => (
                <div key={section.key}>
                  <div className="flex items-center gap-2 mb-2">
                    {section.icon}
                    <span className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
                      {section.label}
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={section.value}
                      onChange={(e) =>
                        onFilterChange({ [section.key]: e.target.value })
                      }
                      className="min-h-[42px] w-full appearance-none rounded-lg border border-secondary-300 bg-white pl-3 pr-9 py-2 text-sm text-secondary-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                    >
                      <option value="all">{section.placeholder}</option>
                      {section.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400 pointer-events-none"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                disabled={!hasActiveFilters}
              >
                Clear all filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}