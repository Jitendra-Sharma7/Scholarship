"use client";

import { ArrowRight } from "lucide-react";

interface DirectoryErrorStateProps {
  message?: string;
  description?: string;
  onRetry: () => void;
}

export function DirectoryErrorState({
  message = "We could not load the directory",
  description = "Please try again. If the problem persists, contact support.",
  onRetry,
}: DirectoryErrorStateProps) {
  return (
    <div className="rounded-xl border border-[var(--gs-border)] border-dashed bg-[var(--gs-surface)] p-12 text-center">
      <h3 className="text-base font-semibold text-[var(--gs-text)] mb-1">
        {message}
      </h3>
      <p className="text-sm text-[var(--gs-muted)] mb-6">
        {description}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--gs-border)] bg-[var(--gs-surface)] px-4 py-2 text-sm font-medium text-[var(--gs-text)] shadow-sm transition-colors hover:bg-[var(--gs-muted)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--gs-brand)] focus:ring-offset-2 focus:ring-offset-[var(--gs-bg)]"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        Try again
      </button>
    </div>
  );
}
