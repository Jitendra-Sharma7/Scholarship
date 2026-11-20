"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { PublicCountryOption, PublicField } from "@/lib/data/public";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface HorizontalFilters {
  country: string;
  studyLevel: string;
  fundingType: string;
  fieldOfStudy: string;
  intake: string;
  deadline: string;
}

interface HorizontalFilterBarProps {
  filters: HorizontalFilters;
  onChange: (filters: HorizontalFilters) => void;
  onClearAll: () => void;
  countries: PublicCountryOption[];
  fields: PublicField[];
  activeFilterChips: Array<{ key: string; label: string; value: string }>;
  onRemoveChip: (key: string, value: string) => void;
}

const studyLevels: FilterOption[] = [
  { value: "", label: "All Levels" },
  { value: "Undergraduate", label: "Undergraduate" },
  { value: "Master's", label: "Master's" },
  { value: "PhD", label: "PhD" },
  { value: "Postdoctoral", label: "Postdoctoral" },
];

const fundingTypes: FilterOption[] = [
  { value: "", label: "All Funding" },
  { value: "fully-funded", label: "Fully Funded" },
  { value: "fully-tuition", label: "Full Tuition" },
  { value: "partial-tuition", label: "Partial Tuition" },
  { value: "stipend", label: "Stipend Only" },
];

const intakeOptions: FilterOption[] = [
  { value: "", label: "All Intakes" },
  { value: "fall-2025", label: "Fall 2025" },
  { value: "spring-2026", label: "Spring 2026" },
  { value: "fall-2026", label: "Fall 2026" },
  { value: "spring-2027", label: "Spring 2027" },
];

const deadlineOptions: FilterOption[] = [
  { value: "", label: "Any Deadline" },
  { value: "next-30-days", label: "Next 30 Days" },
  { value: "next-3-months", label: "Next 3 Months" },
  { value: "next-6-months", label: "Next 6 Months" },
  { value: "next-year", label: "Next Year" },
];

interface FilterConfig {
  key: keyof HorizontalFilters;
  label: string;
  options: FilterOption[];
  placeholder: string;
}

const filterConfigs: FilterConfig[] = [
  { key: "country", label: "Country", options: [], placeholder: "All Countries" },
  { key: "studyLevel", label: "Study Level", options: studyLevels, placeholder: "All Levels" },
  { key: "fundingType", label: "Funding Type", options: fundingTypes, placeholder: "All Funding" },
  { key: "fieldOfStudy", label: "Field of Study", options: [], placeholder: "All Fields" },
  { key: "intake", label: "Intake", options: intakeOptions, placeholder: "All Intakes" },
  { key: "deadline", label: "Deadline", options: deadlineOptions, placeholder: "Any Deadline" },
];

export function HorizontalFilterBar({
  filters,
  onChange,
  onClearAll,
  countries,
  fields,
  activeFilterChips,
  onRemoveChip,
}: HorizontalFilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      let clickedInside = false;
      
      Object.values(dropdownRefs.current).forEach((ref) => {
        if (ref && ref.contains(target)) {
          clickedInside = true;
        }
      });
      
      if (!clickedInside) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const countryOptions: FilterOption[] = [
    { value: "", label: "All Countries" },
    ...countries.map((c) => ({ value: c.id, label: c.name, count: 0 })),
  ];

  const fieldOptions: FilterOption[] = [
    { value: "", label: "All Fields" },
    ...fields.map((f) => ({ value: f.id, label: f.name, count: f.scholarshipCount })),
  ];

  const handleSelect = (filterKey: string, value: string) => {
    onChange({ ...filters, [filterKey]: value } as typeof filters);
    setOpenDropdown(null);
  };

  const renderDropdown = (filterKey: string, options: FilterOption[], selectedValue: string) => {
    if (openDropdown !== filterKey) return null;

    const ref = (el: HTMLDivElement | null) => {
      dropdownRefs.current[filterKey] = el;
      return;
    };

    return (
      <div
        ref={ref}
        className="absolute left-0 top-full z-50 mt-1.5 min-w-[220px] max-h-60 overflow-auto rounded-xl border border-secondary-200 bg-white py-2 shadow-lg animate-slide-in"
        role="menu"
      >
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <button
              key={option.value}
              onClick={() => handleSelect(filterKey, option.value)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors",
                isSelected
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
              )}
              role="menuitem"
              aria-selected={isSelected}
            >
              <span className="truncate">{option.label}</span>
              {option.count !== undefined && option.count > 0 && (
                <span className="shrink-0 rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-600">
                  {option.count}
                </span>
              )}
              {isSelected && <Check className="h-4 w-4 text-primary-600 shrink-0" />}
            </button>
          );
        })}
      </div>
    );
  };

  const renderFilterButton = (config: (typeof filterConfigs)[0], index: number) => {
    const selectedValue = filters[config.key as keyof typeof filters];
    const options = config.key === "country" ? countryOptions : config.key === "fieldOfStudy" ? fieldOptions : config.options;
    const selectedOption = options.find((o) => o.value === selectedValue);
    const isActive = Boolean(selectedValue);
    const displayLabel = selectedOption?.label || config.placeholder;

    return (
      <div key={config.key} className="relative" ref={(el) => { dropdownRefs.current[config.key] = el; }}>
        <button
          type="button"
          onClick={() => setOpenDropdown(openDropdown === config.key ? null : config.key)}
          className={cn(
            "flex items-center gap-1.5 min-w-[150px] max-w-[200px] rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
            isActive
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-secondary-200 bg-white text-secondary-600 hover:border-primary-300 hover:bg-primary-50"
          )}
          aria-expanded={openDropdown === config.key}
          aria-haspopup="listbox"
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", openDropdown === config.key && "rotate-180")}
          />
        </button>
        {renderDropdown(config.key, options, selectedValue)}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {filterConfigs.map(renderFilterButton)}
      </div>

      {(activeFilterChips.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-secondary-500">Active filters:</span>
          {activeFilterChips.map((chip) => (
            <span
              key={`${chip.key}-${chip.value}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700"
            >
              {chip.label}
              <button
                onClick={() => onRemoveChip(chip.key, chip.value)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-primary-500 hover:bg-primary-100"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {activeFilterChips.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs font-medium text-secondary-500 hover:text-primary-600"
            >
              Clear All
            </button>
          )}
        </div>
      )}
    </div>
  );
}