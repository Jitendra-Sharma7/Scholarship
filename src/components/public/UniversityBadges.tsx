"use client";

import { cn } from "@/lib/utils";
import { Award, Clock, Star, Trophy } from "lucide-react";

const NEWLY_ADDED_CUTOFF = Date.now() - 30 * 24 * 60 * 60 * 1000;

/** Verified university rankings only - QS World Ranking and THE Ranking. */
export function RankingBadge({
  ranking,
  source = "qs",
  className,
}: {
  ranking: number | null;
  /** "qs" | "the" - only render when the source ranking is verified. */
  source?: "qs" | "the";
  className?: string;
}) {
  if (!ranking) return null;

  const isQs = source === "qs";
  const label = isQs ? `QS #${ranking}` : `THE #${ranking}`;

  // Tiered colour by verified rank band.
  const tier =
    ranking <= 10
      ? "bg-amber-50 border-amber-200 text-amber-800 ring-1 ring-amber-900/10"
      : ranking <= 50
        ? "bg-primary-50 border-primary-200 text-primary-800 ring-1 ring-primary-900/10"
        : ranking <= 100
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 ring-1 ring-emerald-900/10"
          : ranking <= 500
            ? "bg-slate-50 border-slate-200 text-slate-700 ring-1 ring-slate-900/10"
            : "bg-gray-50 border-gray-200 text-gray-700 ring-1 ring-gray-900/5";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tier,
        className
      )}
      title={`${isQs ? "QS World University Ranking" : "Times Higher Education Ranking"}: #${ranking}`}
    >
      {isQs ? (
        <Trophy className="h-3 w-3 fill-current" />
      ) : (
        <Award className="h-3 w-3 fill-current" />
      )}
      {label}
    </span>
  );
}

/**
 * Scholarship availability state, computed from actual published scholarship
 * records - never a static value.
 */
export function ScholarshipAvailabilityBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  const available = count > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        available
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 ring-1 ring-emerald-900/10"
          : "bg-gray-50 border-gray-200 text-gray-600 ring-1 ring-gray-900/5",
        className
      )}
    >
      {available ? (
        <>
          <Star className="h-3 w-3 fill-current" />
          {count} scholarship{count === 1 ? "" : "s"} available
        </>
      ) : (
        <>
          <span className="h-3 w-3 rounded-full bg-gray-300" />
          No scholarships listed
        </>
      )}
    </span>
  );
}

/** Shown only for universities added recently (within the last 30 days). */
export function NewlyAddedBadge({
  createdAt,
  className,
}: {
  createdAt: Date | string | null;
  className?: string;
}) {
  if (!createdAt) return null;
  const added = new Date(createdAt).getTime();
  if (added < NEWLY_ADDED_CUTOFF) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[10px] font-bold text-primary-800 uppercase tracking-wider",
        className
      )}
    >
      <Clock className="h-3 w-3" /> Newly added
    </span>
  );
}
