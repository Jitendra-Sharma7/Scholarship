"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
    <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
      <svg className="h-12 w-12 text-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="text-base font-semibold text-dark mb-1">{message}</h3>
      <p className="text-sm text-muted max-w-sm mx-auto mb-6">{description}</p>
      {hasActiveFilters && onResetFilters && (
        <Button onClick={onResetFilters} size="sm">
          <RefreshCw className="h-3.5 w-3.5" />
          Clear all filters
        </Button>
      )}
    </div>
  );
}
