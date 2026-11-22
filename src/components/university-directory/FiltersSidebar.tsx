"use client";

import { cloneElement, useId } from "react";
import {
  ChevronDown,
  Filter,
  X,
  Globe,
  MapPin,
  DollarSign,
  Clock,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FiltersSidebarProps {
  countries: { id: string; name: string }[];
  fields: string[];
  intakes: { id: string; name: string; slug: string }[];
  studyLevels: { value: string; label: string }[];
  cities: string[];
  values: {
    country: string;
    city: string;
    studyLevel: string;
    scholarships: string;
    field: string;
    intake: string;
    tuitionRange: string;
  };
  onFilterChange: (patch: Partial<FiltersSidebarProps["values"]>) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

const TUITION_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All tuition ranges" },
  { value: "free", label: "Free / No tuition" },
  { value: "low", label: "Low (under $10k)" },
  { value: "medium", label: "Moderate ($10k–$30k)" },
  { value: "high", label: "High ($30k+)" },
];

const SCHOLARSHIP_FILTERS: { value: string; label: string; group: string }[] = [
  { value: "all", label: "All universities", group: "All" },
  { value: "with", label: "With scholarships", group: "Availability" },
  { value: "without", label: "Without scholarships", group: "Availability" },
  { value: "fully-funded", label: "Fully Funded Scholarships", group: "Funding Type" },
  { value: "partial-tuition", label: "Partially Funded Scholarships", group: "Funding Type" },
  { value: "stipend", label: "Monthly Stipend / Allowance", group: "Funding Type" },
  { value: "mixed", label: "Mixed / Other Funding", group: "Funding Type" },
  { value: "undergraduate", label: "Undergraduate Scholarships", group: "Study Level" },
  { value: "masters", label: "Master's Scholarships", group: "Study Level" },
  { value: "phd", label: "PhD / Doctoral Scholarships", group: "Study Level" },
];

const STUDY_LEVEL_ALL = [{ value: "all", label: "All study levels" }];

export function FiltersSidebar({
  countries,
  fields,
  intakes,
  studyLevels,
  cities,
  values,
  onFilterChange,
  onClearAll,
  hasActiveFilters,
  mobileOpen,
  onToggleMobile,
}: FiltersSidebarProps) {
  return (
    <>
      {/* Desktop: sticky filter sidebar */}
      <div
        className="hidden w-[268px] shrink-0 [@media(min-width:900px)]:sticky [@media(min-width:900px)]:top-[80px] [@media(min-width:900px)]:flex [@media(min-width:900px)]:flex-col"
      >
        <FilterPanel
          countries={countries}
          fields={fields}
          intakes={intakes}
          studyLevels={studyLevels}
          cities={cities}
          values={values}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Mobile: filter drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-[#15264A]/30 backdrop-blur-sm"
            onClick={onToggleMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[380px] flex-col border-l border-[#E2E8F0] bg-[#FFFFFF] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <h2 className="text-[17px] font-semibold text-[#15264A]">Filters</h2>
              <button
                type="button"
                onClick={onToggleMobile}
                className="rounded-[10px] p-2 text-[#64748B] transition-colors hover:bg-[#F3F7FF] hover:text-[#15264A] focus:outline-none focus:ring-2 focus:ring-[#1747D1] focus:ring-offset-2 focus:ring-offset-[#F3F7FF]"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterPanel
                countries={countries}
                fields={fields}
                intakes={intakes}
                studyLevels={studyLevels}
                cities={cities}
                values={values}
                onFilterChange={onFilterChange}
                onClearAll={onClearAll}
                hasActiveFilters={hasActiveFilters}
                mobile
              />
            </div>
            <div className="flex gap-3 border-t border-[#E2E8F0] p-4">
              <button
                type="button"
                onClick={onClearAll}
                disabled={!hasActiveFilters}
                className="flex-1 rounded-[10px] border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-2.5 text-sm font-medium text-[#15264A] transition-colors hover:bg-[#F3F7FF] focus:outline-none focus:ring-2 focus:ring-[#1747D1] focus:ring-offset-2 focus:ring-offset-[#F3F7FF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={onToggleMobile}
                className="flex-1 rounded-[10px] border border-transparent bg-[#1747D1] px-4 py-2.5 text-sm font-medium text-[#FFFFFF] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#1747D1] focus:ring-offset-2 focus:ring-offset-[#F3F7FF]"
              >
                Show results
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

interface FilterPanelProps {
  countries: { id: string; name: string }[];
  fields: string[];
  intakes: { id: string; name: string; slug: string }[];
  studyLevels: { value: string; label: string }[];
  cities: string[];
  values: FiltersSidebarProps["values"];
  onFilterChange: (patch: Partial<FiltersSidebarProps["values"]>) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  mobile?: boolean;
}

function FilterPanel({
  countries,
  fields,
  intakes,
  studyLevels,
  cities,
  values,
  onFilterChange,
  onClearAll,
  hasActiveFilters,
  mobile = false,
}: FilterPanelProps) {
  const id = useId();
  const controlId = (name: string) => `${id}-filter-${name}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 shrink-0 text-[#64748B]" />
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[#64748B]">
          Filters
        </span>
        {hasActiveFilters && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E2F2FF] px-1.5 text-[10px] font-bold text-[#1747D1]">
            {activeFilterCount(values)}
          </span>
        )}
      </div>

      <FilterField label="Country" icon={<Globe className="h-4 w-4" />} id={controlId("country")}>
        <select
          id={controlId("country")}
          value={values.country}
          onChange={(e) => onFilterChange({ country: e.target.value })}
        >
          <option value="all">All countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField label="City" icon={<MapPin className="h-4 w-4" />} id={controlId("city")} showChevron={false}>
        <>
          <input
            type="text"
            id={controlId("city")}
            list={`${controlId("city")}-options`}
            value={values.city === "all" ? "" : values.city}
            onChange={(e) => onFilterChange({ city: e.target.value || "all" })}
            placeholder="Enter city name"
            className="w-full min-w-0 appearance-none rounded-[10px] border border-[#E2E8F0] bg-[#FFFFFF] pl-3 pr-9 py-2.5 text-sm text-[#15264A] shadow-sm transition-colors focus:border-[#1747D1] focus:outline-none focus:ring-2 focus:ring-[#1747D1]/20 focus:ring-offset-1"
          />
          <datalist id={`${controlId("city")}-options`}>
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </>
      </FilterField>

      <FilterField label="Subject area" icon={<MapPin className="h-4 w-4" />} id={controlId("field")}>
        <select
          id={controlId("field")}
          value={values.field}
          onChange={(e) => onFilterChange({ field: e.target.value })}
        >
          <option value="all">All subjects</option>
          {fields.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField
        label="Study level"
        icon={<GraduationCap className="h-4 w-4" />}
        id={controlId("study-level")}
      >
        <select
          id={controlId("study-level")}
          value={values.studyLevel}
          onChange={(e) => onFilterChange({ studyLevel: e.target.value })}
        >
          {[...STUDY_LEVEL_ALL, ...studyLevels].map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField
        label="Tuition per year"
        icon={<DollarSign className="h-4 w-4" />}
        id={controlId("tuition")}
      >
        <select
          id={controlId("tuition")}
          value={values.tuitionRange}
          onChange={(e) => onFilterChange({ tuitionRange: e.target.value })}
        >
          {TUITION_FILTERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField
        label="Academic intake"
        icon={<Clock className="h-4 w-4" />}
        id={controlId("intake")}
      >
        <select
          id={controlId("intake")}
          value={values.intake}
          onChange={(e) => onFilterChange({ intake: e.target.value })}
        >
          <option value="all">All intakes</option>
          {intakes.map((intake) => (
            <option key={intake.id} value={intake.slug}>
              {intake.name}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField
        label="Scholarship type"
        icon={<Filter className="h-4 w-4" />}
        id={controlId("scholarships")}
      >
        <select
          id={controlId("scholarships")}
          value={values.scholarships}
          onChange={(e) => onFilterChange({ scholarships: e.target.value })}
        >
          <optgroup label="All">
            {SCHOLARSHIP_FILTERS.filter((s) => s.group === "All").map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Availability">
            {SCHOLARSHIP_FILTERS.filter((s) => s.group === "Availability").map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Funding Type">
            {SCHOLARSHIP_FILTERS.filter((s) => s.group === "Funding Type").map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Study Level">
            {SCHOLARSHIP_FILTERS.filter((s) => s.group === "Study Level").map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </optgroup>
        </select>
      </FilterField>

      {!mobile && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onClearAll}
            disabled={!hasActiveFilters}
            className="w-full rounded-[10px] border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-2.5 text-sm font-medium text-[#15264A] transition-colors hover:bg-[#F3F7FF] focus:outline-none focus:ring-2 focus:ring-[#1747D1] focus:ring-offset-2 focus:ring-offset-[#F3F7FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset all
          </button>
        </div>
      )}
    </div>
  );
}

function activeFilterCount(values: FiltersSidebarProps["values"]): number {
  return (
    (values.country !== "all" ? 1 : 0) +
    (values.city !== "all" ? 1 : 0) +
    (values.field !== "all" ? 1 : 0) +
    (values.tuitionRange !== "all" ? 1 : 0) +
    (values.studyLevel !== "all" ? 1 : 0) +
    (values.intake !== "all" ? 1 : 0) +
    (values.scholarships !== "all" ? 1 : 0)
  );
}

function FilterField({
  label,
  icon,
  id,
  children,
  showChevron = true,
}: {
  label: string;
  icon: React.ReactNode;
  id: string;
  children: React.ReactElement<HTMLSelectElement | HTMLInputElement>;
  showChevron?: boolean;
}) {
  const selectClasses =
    "w-full min-w-0 appearance-none rounded-[10px] border border-[#E2E8F0] bg-[#FFFFFF] pl-3 pr-9 py-2.5 text-sm text-[#15264A] shadow-sm transition-colors focus:border-[#1747D1] focus:outline-none focus:ring-2 focus:ring-[#1747D1]/20 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

  const isSelect = children.type === "select";

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <label
          htmlFor={id}
          className="text-[12px] font-semibold uppercase tracking-wider text-[#64748B]"
        >
          {label}
        </label>
      </div>
      <div className="relative min-w-0">
        {cloneElement(children, {
          className: cn(
            selectClasses,
            (children.props as { className?: string }).className,
          ),
        })}
        {isSelect && showChevron && (
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
        )}
      </div>
    </div>
  );
}