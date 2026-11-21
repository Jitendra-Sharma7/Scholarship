"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Globe,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversityImage } from "@/components/public/UniversityImage";
import { CountryFlag } from "@/components/ui/CountryFlag";
import {
  RankingBadge,
  ScholarshipAvailabilityBadge,
} from "@/components/public/UniversityBadges";
import { Button } from "@/components/ui/Button";
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

interface UniversityCardProps {
  university: PublicUniversity;
  priority?: boolean;
}

export function UniversityCard({
  university,
  priority = false,
}: UniversityCardProps) {
  const pathname = usePathname();
  const countryLabel =
    university.city && university.country
      ? `${university.city}, ${university.country}`
      : university.country || university.city;
  const levels = studyLevelsFor(university);
  const isActive = pathname === `/universities/${university.slug ?? university.id}`;
  const tags = university.popularFields.slice(0, 3);

  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const isSaved = useStore((s) => s.isSaved(university.id));
  const toggleSaveUniversity = useStore((s) => s.toggleSaveScholarship);

  const [isSaving, setIsSaving] = useState(false);

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
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1",
        isActive && "ring-2 ring-primary-600 bg-primary-light/50"
      )}
    >
      {/* Top section: image + badges */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl bg-secondary-50">
        <UniversityImage
          src={university.coverImage}
          alt={`Campus of ${university.name}`}
          initials={university.name}
          priority={priority}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* University logo overlay */}
        {university.logo && (
          <div className="absolute -inset-0.5 bg-gradient-to-b from-transparent via-black/40 to-black/60 pointer-events-none" />
        )}
        {university.logo && (
          <img
            src={university.logo}
            alt={`${university.name} logo`}
            className="absolute top-4 left-4 z-20 h-12 w-12 rounded-full bg-surface p-1 shadow-sm object-contain"
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
          <RankingBadge
            ranking={university.qsRanking}
            source="qs"
            className="text-[10px] px-2 py-0.5"
          />
          {university.theRanking && !university.qsRanking && (
            <RankingBadge
              ranking={university.theRanking}
              source="the"
              className="text-[10px] px-2 py-0.5"
            />
          )}
        </div>

        <div className="absolute top-3 right-3 z-20">
          <ScholarshipAvailabilityBadge
            count={university.scholarshipCount}
            className="text-[10px] px-2 py-0.5"
          />
        </div>

        {/* Favorite button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            "absolute bottom-3 right-3 z-20 rounded-lg p-2 transition-all duration-200",
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
      </div>

      {/* Content body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-dark leading-tight line-clamp-2">
            {university.name}
          </h3>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted mb-3">
          <CountryFlag code={university.countryCode} name={university.country} size="xs" />
          <span className="truncate" title={countryLabel ?? undefined}>
            {countryLabel}
          </span>
        </p>

        {university.description && (
          <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-4">
            {university.description}
          </p>
        )}

        {/* Ranking + Study levels */}
        <div className="mb-3">
          {ranking && (
            <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium text-dark">Global ranking:</span>{" "}
              <span className="font-semibold text-dark">#{ranking}</span>
            </div>
          )}
          {levels.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium text-dark">Study levels:</span>{" "}
              <span className="truncate">{levels.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Subject tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((field) => (
              <span
                key={field}
                className="rounded-md border border-border bg-primary-light px-2 py-0.5 text-[10px] font-medium text-primary-dark uppercase tracking-wider"
                title={field}
              >
                {field}
              </span>
            ))}
          </div>
        )}

        {/* Scholarship availability */}
        <div className="mb-auto flex items-center gap-1.5 text-xs">
          <ScholarshipAvailabilityBadge
            count={university.scholarshipCount}
            className="text-xs px-2.5 py-1"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50 p-4 rounded-b-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/universities/${university.slug ?? university.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
          >
            View University
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
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
      </footer>
    </article>
  );
}
