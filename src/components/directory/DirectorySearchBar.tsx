"use client";

import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DirectorySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  onFilterClick: () => void;
  isMobileFilterOpen: boolean;
  placeholder?: string;
}

export function DirectorySearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  hasActiveFilters,
  onFilterClick,
  isMobileFilterOpen,
  placeholder = "Search scholarships by name, university, country, or field...",
}: DirectorySearchBarProps) {
  return (
    <form onSubmit={onSubmit} className="w-full" role="search">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <label htmlFor="directory-search" className="sr-only">
            Search scholarships
          </label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            id="directory-search"
            type="search"
            maxLength={120}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-secondary-200 bg-white py-3.5 pl-12 pr-4 text-base text-secondary-900 placeholder:text-secondary-400 shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            autoComplete="off"
          />
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="hidden shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-700 sm:inline-flex"
        >
          <Search className="h-5 w-5" />
          Search
        </button>
        <button
          type="button"
          onClick={onFilterClick}
          className={cn(
            "shrink-0 flex items-center gap-2 rounded-xl border border-secondary-200 bg-white px-5 py-3.5 text-sm font-medium text-secondary-700 shadow-sm transition-all hover:bg-secondary-50",
            hasActiveFilters && "border-primary-500 bg-primary-50 text-primary-700"
          )}
          aria-expanded={isMobileFilterOpen}
          aria-controls="filter-drawer"
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-100 px-1.5 text-[10px] font-bold text-primary-700" aria-label="Active filters">
              ✕
            </span>
          )}
        </button>
      </div>
    </form>
  );
}