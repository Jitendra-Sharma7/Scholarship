"use client";

import { cn } from "@/lib/utils";

interface DirectoryLoadingSkeletonProps {
  count?: number;
  view?: "grid" | "list";
}

export function DirectoryLoadingSkeleton({
  count = 6,
  view = "grid",
}: DirectoryLoadingSkeletonProps) {
  if (view === "list") {
    return (
      <div className="space-y-3">
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-xl border border-border bg-surface p-4 animate-pulse"
          >
            <span className="shrink-0 h-16 w-24 rounded-lg bg-secondary-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-secondary-200 rounded" />
              <div className="h-3 w-full bg-secondary-200 rounded" />
              <div className="h-3 w-1/3 bg-secondary-200 rounded" />
            </div>
            <div className="h-8 w-32 rounded-lg bg-secondary-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-surface animate-pulse"
        >
          <span className="aspect-[16/9] rounded-t-xl bg-secondary-200" />
          <div className="p-5">
            <div className="h-4 w-3/4 bg-secondary-200 rounded mb-2" />
            <div className="h-3 w-full bg-secondary-200 rounded mb-1" />
            <div className="h-3 w-1/2 bg-secondary-200 rounded" />
          </div>
          <div className="h-2 px-5 pb-5 w-1/3 bg-secondary-200 rounded-b-xl" />
        </div>
      ))}
    </div>
  );
}
