"use client";

import { cloneElement } from "react";
import {
  ChevronDown,
  Filter,
  X,
  Globe,
  MapPin,
  DollarSign,
  GraduationCap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FiltersSidebarProps {
  countries: { id: string; name: string }[];
  fields: string[];
  intakes: { id: string; name: string; slug: string }[];
  studyLevels: { value: string; label: string }[];
  values: {
    country: string;
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
  { value: "medium", label: "Moderate ($10k\u2013$30k)" },
  { value: "high", label: "High ($30k+)" },
];

export function FiltersSidebar({
  countries,
  fields,
  intakes,
  studyLevels,
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
      <div className="w-[268px] shrink-0 hidden [@media(min-width:900px)]:sticky [@media(min-width:900px)]:top-[80px] [@media(min-width:900px)]:flex [@media(min-width:900px)]:flex-col [@media(min-width:900px)]:gap-6">
        <FilterPanel
          countries={countries}
          fields={fields}
          intakes={intakes}
          studyLevels={studyLevels}
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
            className="fixed inset-0 z-50 bg-[var(--gs-text)]/25 backdrop-blur-sm"
            onClick={onToggleMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[380px] bg-[var(--gs-surface)] border-l border-[var(--gs-border)] shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--gs-border)] px-5 py-4">
              <h2 className="text-[17px] font-semibold text-[var(--gs-text)]">Filters</h2>
              <button
                type="button"
                onClick={onToggleMobile}
                className="rounded-[10px] p-2 text-[var(--gs-muted)] transition-colors hover:bg-[var(--gs-muted)]/10 hover:text-[var(--gs-text)] focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)] focus:ring-offset-2 focus:ring-offset-[var(--gs-bg)]"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FilterPanel
                countries={countries}
                fields={fields}
                intakes={intakes}
                studyLevels={studyLevels}
                values={values}
                onFilterChange={onFilterChange}
                onClearAll={onClearAll}
                hasActiveFilters={hasActiveFilters}
                mobile
              />
            </div>
            <div className="border-t border-[var(--gs-border)] p-4 gap-3">
              <button
                type="button"
                onClick={onClearAll}
                disabled={!hasActiveFilters}
                className="flex-1 rounded-[10px] border border-[var(--gs-border)] bg-[var(--gs-surface)] px-4 py-2.5 text-sm font-medium text-[var(--gs-text)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--gs-muted)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)] focus:ring-offset-2 focus:ring-offset-[var(--gs-bg)]"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={onToggleMobile}
                className="flex-1 rounded-[10px] border border-transparent bg-[var(--gs-brand)] px-4 py-2.5 text-sm font-medium text-[var(--gs-brand-text)] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)] focus:ring-offset-2 focus:ring-offset-[var(--gs-bg)]"
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
  values,
  onFilterChange,
  onClearAll,
  hasActiveFilters,
  mobile = false,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-[var(--gs-muted)]" />
        <span className="text-[12px] font-semibold text-[var(--gs-muted)] uppercase tracking-wider">
          Filters
        </span>
        {hasActiveFilters && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gs-soft-brand)] px-1.5 text-[10px] font-bold text-[var(--gs-brand)]">
            {activeFilterCount(values)}
          </span>
        )}
      </div>

      <FilterField label="Country" icon={<Globe className="h-4 w-4" />} id="filter-country">
        <select
          id="filter-country"
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

      <FilterField label="Subject area" icon={<MapPin className="h-4 w-4" />} id="filter-field">
        <select
          id="filter-field"
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

      <FilterField label="Tuition per year" icon={<DollarSign className="h-4 w-4" />} id="filter-tuition">
        <select
          id="filter-tuition"
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

      <FilterField label="Study level" icon={<GraduationCap className="h-4 w-4" />} id="filter-study-level">
        <div className="flex gap-2">
          {[{ value: "all", label: "All" }, ...studyLevels].map((chip) => {
            const selected =
              chip.value === "all"
                ? values.studyLevel === "all"
                : values.studyLevel === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => onFilterChange({ studyLevel: chip.value })}
                aria-pressed={selected}
                className={cn(
                  "flex-1 cursor-pointer rounded-full border py-1.5 text-[12px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)] focus:ring-offset-2 focus:ring-offset-[var(--gs-bg)]",
                  selected
                    ? "border-[var(--gs-brand)] bg-[var(--gs-brand)] text-[var(--gs-brand-text)]"
                    : "border-[var(--gs-border)] bg-[var(--gs-surface)] text-[var(--gs-text)] hover:bg-[var(--gs-muted)]/10 hover:text-[var(--gs-text)]",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </FilterField>

      <FilterField label="Intake" icon={<Clock className="h-4 w-4" />} id="filter-intake">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onFilterChange({ intake: "all" })}
            aria-pressed={values.intake === "all"}
            className={cn(
              "cursor-pointer rounded-full border py-1.5 px-3 text-[12px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)] focus:ring-offset-2 focus:ring-offset-[var(--gs-bg)]",
              values.intake === "all"
                ? "border-[var(--gs-brand)] bg-[var(--gs-brand)] text-[var(--gs-brand-text)]"
                : "border-[var(--gs-border)] bg-[var(--gs-surface)] text-[var(--gs-text)] hover:bg-[var(--gs-muted)]/10 hover:text-[var(--gs-text)]",
            )}
          >
            All
          </button>
          {intakes.map((intake) => {
            const selected = values.intake === intake.slug;
            return (
              <button
                key={intake.id}
                type="button"
                onClick={() => onFilterChange({ intake: intake.slug })}
                aria-pressed={selected}
                className={cn(
                  "cursor-pointer rounded-full border py-1.5 px-3 text-[12px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)] focus:ring-offset-2 focus:ring-offset-[var(--gs-bg)]",
                  selected
                    ? "border-[var(--gs-brand)] bg-[var(--gs-brand)] text-[var(--gs-brand-text)]"
                    : "border-[var(--gs-border)] bg-[var(--gs-surface)] text-[var(--gs-text)] hover:bg-[var(--gs-muted)]/10 hover:text-[var(--gs-text)]",
                )}
              >
                {intake.name}
              </button>
            );
          })}
        </div>
      </FilterField>

      <div className="border-t border-[var(--gs-border)] pt-4">
        <div className="flex items-center gap-3">
          <input
            id="filter-scholarships"
            type="checkbox"
            checked={values.scholarships === "with"}
            onChange={() => onFilterChange({ scholarships: values.scholarships === "with" ? "all" : "with" })}
            className="rounded-[10px] border-[var(--gs-border)] bg-[var(--gs-surface)] text-[var(--gs-brand)] focus:ring-0 h-5 w-5 shrink-0 appearance-none checked:bg-[var(--gs-brand)] checked:border-[var(--gs-brand)]"
          />
          <label
            htmlFor="filter-scholarships"
            className="text-[14px] leading-1.5 text-[var(--gs-text)] cursor-pointer"
          >
            Only with scholarships
          </label>
        </div>
      </div>

      {!mobile && (
        <div className="pt-4">
          <button
            type="button"
            onClick={onClearAll}
            disabled={!hasActiveFilters}
            className="w-full rounded-[10px] border border-[var(--gs-border)] bg-[var(--gs-surface)] px-4 py-2.5 text-sm font-medium text-[var(--gs-text)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--gs-muted)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)] focus:ring-offset-2 focus:ring-offset-[var(--gs-bg)]"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function activeFilterCount(values: FiltersSidebarProps["values"]): number {
  return (
    (values.country !== "all" ? 1 : 0) +
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
}: {
  label: string;
  icon: React.ReactNode;
  id: string;
  children: React.ReactElement<HTMLSelectElement>;
}) {
  const selectClasses =
    "w-full appearance-none rounded-[10px] border border-[var(--gs-border)] bg-[var(--gs-surface)] pl-3 pr-10 py-2.5 text-sm text-[var(--gs-text)] shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:border-[var(--gs-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)]/20 focus:ring-offset-1";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <label
          htmlFor={id}
          className="text-[12px] font-semibold text-[var(--gs-muted)] uppercase tracking-wider"
        >
          {label}
        </label>
      </div>
      <div className="relative">
        {cloneElement(children, {
          className: cn(
            selectClasses,
            (children.props as { className?: string }).className,
          ),
        })}
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gs-muted)] pointer-events-none"
        />
      </div>
    </div>
  );
}
