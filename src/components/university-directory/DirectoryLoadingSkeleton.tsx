"use client";

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
            className="flex gap-4 rounded-xl border border-[var(--gs-border)] bg-[var(--gs-surface)] p-4 animate-pulse"
          >
            <span className="shrink-0 h-16 w-24 rounded-[12px] bg-[var(--gs-muted)]/20" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-[var(--gs-muted)]/20 rounded" />
              <div className="h-3 w-full bg-[var(--gs-muted)]/20 rounded" />
              <div className="h-3 w-1/3 bg-[var(--gs-muted)]/20 rounded" />
            </div>
            <div className="h-8 w-32 rounded-lg bg-[var(--gs-muted)]/20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-[18px]">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-[var(--gs-border)] bg-[var(--gs-surface)] animate-pulse"
        >
          <span className="h-[92px] w-full bg-[var(--gs-muted)]/20" />
          <div className="p-4">
            <div className="h-4 w-3/4 bg-[var(--gs-muted)]/20 rounded mb-2" />
            <div className="h-3 w-full bg-[var(--gs-muted)]/20 rounded mb-1" />
            <div className="h-3 w-1/2 bg-[var(--gs-muted)]/20 rounded" />
          </div>
          <div className={`h-2 px-4 pb-4 w-1/3 bg-[var(--gs-muted)]/20 rounded-b-xl`} />
        </div>
      ))}
    </div>
  );
}
