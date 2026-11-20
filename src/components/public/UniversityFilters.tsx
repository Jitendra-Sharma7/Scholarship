"use client";

import { useState } from "react";
import { ChevronDown, Filter, Globe, Trophy, Users, GraduationCap, Award, MapPin, Shield, Clock } from "lucide-react";
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

function filterIcon(value: string) {
  switch (value) {
    case "country": return <Globe className="h-4 w-4" />;
    case "ranking": return <Trophy className="h-4 w-4" />;
    case "studyLevel": return <GraduationCap className="h-4 w-4" />;
    case "scholarships": return <Award className="h-4 w-4" />;
    case "field": return <MapPin className="h-4 w-4" />;
    case "type": return <Shield className="h-4 w-4" />;
    case "intake": return <Clock className="h-4 w-4" />;
    default: return <Filter className="h-4 w-4" />;
  }
}

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
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-t-xl border-b border-b-gray-200 bg-gray-50/50 px-5 py-3.5 text-left transition-colors hover:bg-gray-100",
          !expanded && "rounded-b-xl"
        )}
        aria-expanded={expanded}
        aria-controls="university-filters-panel"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="font-semibold text-gray-900">Filters</span>
          {hasActiveFilters && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-100 px-1.5 text-[10px] font-bold text-primary-700">
              {Object.values(values).filter(
                (v) => v !== "all" && v !== ""
              ).length}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-gray-400 transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <div id="university-filters-panel" className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section) => (
              <div key={section.key}>
                <div className="flex items-center gap-2 mb-2">
                  {section.icon}
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {section.label}
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={section.value}
                    onChange={(e) =>
                      onFilterChange({ [section.key]: e.target.value })
                    }
                    className="min-h-[42px] w-full appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-9 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                  >
                    <option value="all">{section.placeholder}</option>
                    {section.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
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
  );
}
