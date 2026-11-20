"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Filter, X, Check } from "lucide-react";
import { CountryFlagWithName } from "@/components/ui/CountryFlag";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { PublicCountryOption, PublicField } from "@/lib/data/public";

interface SidebarFilters {
  scholarshipType: string[];
  country: string[];
  studyLevel: string[];
  deadline: string[];
  fieldOfStudy: string[];
  fundingAmount: string[];
  university: string[];
  provider: string[];
}

interface FilterSidebarProps {
  filters: SidebarFilters;
  onChange: (filters: SidebarFilters) => void;
  onReset: () => void;
  countries: PublicCountryOption[];
  fields: PublicField[];
  scholarshipCounts: {
    scholarshipType: Record<string, number>;
    country: Record<string, number>;
    studyLevel: Record<string, number>;
    deadline: Record<string, number>;
  };
  isMobile?: boolean;
  onClose?: () => void;
}

const scholarshipTypes = [
  { value: "fully-funded", label: "Fully Funded" },
  { value: "partial-funding", label: "Partial Funding" },
  { value: "tuition-discount", label: "Tuition Fee Discount" },
];

const studyLevels = [
  { value: "Undergraduate", label: "Undergraduate" },
  { value: "Master's", label: "Master's" },
  { value: "PhD", label: "PhD" },
  { value: "Postdoctoral", label: "Postdoctoral" },
];

const deadlineOptions = [
  { value: "next-3-months", label: "Next 3 Months" },
  { value: "next-6-months", label: "Next 6 Months" },
  { value: "next-year", label: "Next Year" },
];

const fundingAmountOptions = [
  { value: "0-5000", label: "Up to $5,000" },
  { value: "5000-15000", label: "$5,000 - $15,000" },
  { value: "15000-30000", label: "$15,000 - $30,000" },
  { value: "30000+", label: "$30,000+" },
];

function FilterSection({
  title,
  options,
  selectedValues,
  onToggle,
  counts,
  showMore = false,
  initiallyExpanded = true,
}: {
  title: string;
  options: Array<{ value: string; label: string }>;
  selectedValues: string[];
  onToggle: (value: string) => void;
  counts: Record<string, number>;
  showMore?: boolean;
  initiallyExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const displayOptions = showMore && !expanded ? options.slice(0, 5) : options;
  const hasMore = showMore && options.length > 5 && !expanded;

  return (
    <div className="border-b border-secondary-100 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 text-sm font-semibold text-secondary-900"
        aria-expanded={expanded}
      >
        {title}
        {expanded ? <ChevronUp className="h-4 w-4 text-secondary-400" /> : <ChevronDown className="h-4 w-4 text-secondary-400" />}
      </button>

      {expanded && (
        <div className="space-y-2 pt-2 animate-slide-down">
          {displayOptions.map((option) => {
            const count = counts[option.value] || 0;
            const isSelected = selectedValues.includes(option.value);
            return (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(option.value)}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-sm text-secondary-700 flex-1 truncate">{option.label}</span>
                {count > 0 && (
                  <span className="shrink-0 rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-600">
                    {count}
                  </span>
                )}
              </label>
            );
          })}
          {hasMore && (
            <button
              onClick={() => setExpanded(true)}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Show more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function FilterSidebar({
  filters,
  onChange,
  onReset,
  countries,
  fields,
  scholarshipCounts,
  isMobile = false,
  onClose,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    scholarshipType: true,
    country: true,
    studyLevel: true,
    deadline: true,
    fieldOfStudy: false,
    fundingAmount: false,
    university: false,
    provider: false,
  });

  const handleToggle = (section: string, value: string) => {
    const current = filters[section as keyof typeof filters] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [section]: updated });
  };

  const handleCountryToggle = (value: string) => handleToggle("country", value);
  const handleStudyLevelToggle = (value: string) => handleToggle("studyLevel", value);
  const handleScholarshipTypeToggle = (value: string) => handleToggle("scholarshipType", value);
  const handleDeadlineToggle = (value: string) => handleToggle("deadline", value);
  const handleFieldOfStudyToggle = (value: string) => handleToggle("fieldOfStudy", value);
  const handleFundingAmountToggle = (value: string) => handleToggle("fundingAmount", value);

  const hasActiveFilters = Object.values(filters).some((arr) => arr.length > 0);

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto animate-slide-in">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-secondary-200 bg-white px-4 py-3">
            <h2 id="filter-drawer-title" className="font-semibold text-secondary-900">Filters</h2>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={() => { onReset(); onClose?.(); }}
                  className="text-xs font-medium text-secondary-500 hover:text-primary-600"
                >
                  Reset all
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-secondary-400 hover:bg-secondary-100"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-4 space-y-6">
            <FilterSection
              title="Scholarship Type"
              options={scholarshipTypes}
              selectedValues={filters.scholarshipType}
              onToggle={handleScholarshipTypeToggle}
              counts={scholarshipCounts.scholarshipType}
            />
            <FilterSection
              title="Country"
              options={countries.map((c) => ({ value: c.id, label: c.name }))}
              selectedValues={filters.country}
              onToggle={handleCountryToggle}
              counts={scholarshipCounts.country}
              showMore
            />
            <FilterSection
              title="Study Level"
              options={studyLevels}
              selectedValues={filters.studyLevel}
              onToggle={handleStudyLevelToggle}
              counts={scholarshipCounts.studyLevel}
            />
            <FilterSection
              title="Application Deadline"
              options={deadlineOptions}
              selectedValues={filters.deadline}
              onToggle={handleDeadlineToggle}
              counts={scholarshipCounts.deadline}
            />
            <FilterSection title="Field of Study" options={fields.map((f) => ({ value: f.id, label: f.name }))} selectedValues={filters.fieldOfStudy} onToggle={handleFieldOfStudyToggle} counts={{}} />
            <FilterSection title="Funding Amount" options={fundingAmountOptions} selectedValues={filters.fundingAmount} onToggle={handleFundingAmountToggle} counts={{}} />
          </div>
          <div className="sticky bottom-0 border-t border-secondary-200 bg-white p-4">
            <Button variant="primary" className="w-full" onClick={onClose}>
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className="sticky top-24 rounded-2xl border border-secondary-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between border-b border-secondary-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary-600" />
            <h2 className="font-semibold text-secondary-900">Filters</h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs font-medium text-secondary-500 hover:text-primary-600"
            >
              <X className="h-3 w-3" />
              Reset all
            </button>
          )}
        </div>

        <div className="space-y-6">
          <FilterSection
            title="Scholarship Type"
            options={scholarshipTypes}
            selectedValues={filters.scholarshipType}
            onToggle={handleScholarshipTypeToggle}
            counts={scholarshipCounts.scholarshipType}
          />
          <FilterSection
            title="Country"
            options={countries.map((c) => ({ value: c.id, label: c.name }))}
            selectedValues={filters.country}
            onToggle={handleCountryToggle}
            counts={scholarshipCounts.country}
            showMore
          />
          <FilterSection
            title="Study Level"
            options={studyLevels}
            selectedValues={filters.studyLevel}
            onToggle={handleStudyLevelToggle}
            counts={scholarshipCounts.studyLevel}
          />
          <FilterSection
            title="Application Deadline"
            options={deadlineOptions}
            selectedValues={filters.deadline}
            onToggle={handleDeadlineToggle}
            counts={scholarshipCounts.deadline}
          />
          <FilterSection title="Field of Study" options={fields.map((f) => ({ value: f.id, label: f.name }))} selectedValues={filters.fieldOfStudy} onToggle={handleFieldOfStudyToggle} counts={{}} showMore />
<FilterSection title="Funding Amount" options={fundingAmountOptions} selectedValues={filters.fundingAmount} onToggle={handleFundingAmountToggle} counts={{}} />
<FilterSection title="University" options={[]} selectedValues={filters.university} onToggle={handleFundingAmountToggle} counts={{}} />
<FilterSection title="Scholarship Provider" options={[]} selectedValues={filters.provider} onToggle={handleFundingAmountToggle} counts={{}} />
        </div>
      </div>
    </aside>
  );
}