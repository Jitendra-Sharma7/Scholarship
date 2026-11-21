"use client";

import { RefreshCw } from "lucide-react";

interface DirectoryEmptyStateProps {
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  message?: string;
  description?: string;
}

export function DirectoryEmptyState({
  onResetFilters,
  hasActiveFilters = false,
  message = "No universities found",
  description = "Try adjusting your search or filters to find what you're looking for.",
}: DirectoryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--gs-border)] border-dashed bg-[var(--gs-surface)] p-12 text-center">
      <svg
        className="h-10 w-10 text-[var(--gs-muted)] mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="text-base font-semibold text-[var(--gs-text)] mb-1">
        {message}
      </h3>
      <p className="text-sm text-[var(--gs-muted)] max-w-sm mx-auto mb-6">
        {description}
      </p>
      {hasActiveFilters && onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--gs-border)] bg-[var(--gs-surface)] px-4 py-2 text-sm font-medium text-[var(--gs-text)] shadow-sm transition-colors hover:bg-[var(--gs-muted)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)] focus:ring-offset-2 focus:ring-offset-[var(--gs-bg)]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Clear filters
        </button>
      )}
    </div>
  );
}
