"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  MapPin,
  Trophy,
  Star,
  GraduationCap,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { UniversityImage } from "@/components/public/UniversityImage";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { ScholarshipAvailabilityBadge } from "@/components/public/UniversityBadges";
import type { PublicUniversity } from "@/lib/data/public";
import { useStore } from "@/lib/store/useStore";

const STUDY_LEVEL_LABELS: Record<string, string> = {
  Undergraduate: "Undergraduate",
  "Master's": "Postgraduate",
  MBA: "Postgraduate",
  Doctoral: "Postgraduate",
  JD: "Postgraduate",
  MD: "Postgraduate",
  PhD: "PhD",
  Postdoctoral: "Postgraduate",
  Research: "Postgraduate",
  "Professional Fellowship": "Postgraduate",
};

function studyLevelsFor(university: PublicUniversity): string[] {
  if (!university.scholarships?.length) return [];
  const seen = new Set<string>();
  for (const scholarship of university.scholarships) {
    for (const level of scholarship.degreeLevels) {
      const label = STUDY_LEVEL_LABELS[level];
      if (label) seen.add(label);
    }
  }
  return [...seen].slice(0, 3);
}

interface UniversityListItemProps {
  university: PublicUniversity;
}

export function UniversityListItem({ university }: UniversityListItemProps) {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const isSaved = useStore((s) => s.isSaved(university.id));
  const toggleSaveUniversity = useStore((s) => s.toggleSaveScholarship);

  const [isSaving, setIsSaving] = useState(false);

  const countryLabel =
    university.city && university.country
      ? `${university.city}, ${university.country}`
      : university.country || university.city;
  const levels = studyLevelsFor(university);

  const handleFavoriteClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) return;
    setIsSaving(true);
    toggleSaveUniversity(university.id);
    setTimeout(() => setIsSaving(false), 300);
  };

  const handleExternalClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (university.website) window.open(university.website, "_blank", "noopener");
  };

  const ranking = university.qsRanking ?? university.theRanking ?? null;

  return (
    <Link
      href={`/universities/${university.slug ?? university.id}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:shadow-card-hover hover:-translate-y-1"
      prefetch={true}
    >
      <div className="shrink-0 relative">
        <UniversityImage
          src={university.coverImage}
          alt={`Campus of ${university.name}`}
          initials={university.name}
          className="h-16 w-24 object-cover"
        />
        {ranking && (
          <div className="absolute -right-1 -bottom-1 z-20">
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-[10px] font-bold text-dark">
              <Trophy className="h-3 w-3 shrink-0" />
              #{ranking}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <h3 className="text-sm font-semibold text-dark leading-tight line-clamp-1">
            {university.name}
          </h3>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted mb-2">
          <CountryFlag code={university.countryCode} name={university.country} size="xs" />
          <span className="truncate" title={countryLabel ?? undefined}>
            {countryLabel}
          </span>
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 text-xs text-muted">
          <div className="flex items-center gap-1">
            <Trophy className="h-3 w-3 shrink-0 text-muted" />
            <span className="font-medium text-dark">
              {ranking ? `#${ranking}` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3 shrink-0 text-muted" />
            <span className="font-medium text-dark">
              {levels.length > 0 ? levels.join(", ") : "—"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 shrink-0 text-muted" />
            <span className="font-medium text-dark">
              {university.scholarshipCount} scholarships
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-muted" />
            <span className="font-medium text-dark">
              {university.internationalStudentPercent != null
                ? `${university.internationalStudentPercent}% intl`
                : "—"}
            </span>
          </div>
        </div>

        <div className="mt-2 text-sm text-muted line-clamp-1">
          {university.popularFields.slice(0, 3).join(", ") || "No subject areas listed"}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ScholarshipAvailabilityBadge count={university.scholarshipCount} />
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            "rounded-lg p-2 transition-all duration-200",
            isSaved
              ? "bg-primary-600 text-white shadow-sm"
              : "bg-surface/90 border border-border text-muted shadow-sm hover:bg-surface hover:text-primary-600"
          )}
          aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isSaved}
          disabled={isSaving}
        >
          {isSaving ? (
            <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isSaved ? (
            <BookmarkCheck className="h-5 w-5" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
        </button>
        {university.website && (
          <button
            onClick={handleExternalClick}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-dark"
            aria-label={`Official website of ${university.name}`}
            title="Official website"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>
    </Link>
  );
}
