"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";import { cn } from "@/lib/utils";
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

function intakeNamesFor(university: PublicUniversity): string[] {
  if (!university.scholarships?.length) return [];
  const seen = new Set<string>();
  for (const scholarship of university.scholarships) {
    for (const link of scholarship.intakes) {
      if (link.intake) seen.add(link.intake.name);
    }
  }
  return [...seen].slice(0, 2);
}

function universityHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  return hash;
}

function coverColor(hue: number): string {
  return `linear-gradient(135deg, hsl(${hue}, 55%, 38%), hsl(${(hue + 40) % 360}, 55%, 38%))`;
}

interface UniversityListItemProps {
  university: PublicUniversity;
}

export function UniversityListItem({ university }: UniversityListItemProps) {
  const pathname = usePathname();
  const countryLabel =
    university.city && university.country
      ? `${university.city}, ${university.country}`
      : university.country || university.city;
  const levels = studyLevelsFor(university);
  const intakes = intakeNamesFor(university);
  const tags = university.popularFields.slice(0, 4);
  const ranking = university.qsRanking ?? university.theRanking ?? null;
  const hue = universityHue(university.id);
  const isActive = pathname === `/universities/${university.slug ?? university.id}`;

  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const isSaved = useStore((s) => s.isSavedUniversity(university.id));
  const toggleSaveUniversity = useStore((s) => s.toggleSaveUniversity);

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

  const initials = university.name
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <Link
      href={`/universities/${university.slug ?? university.id}`}
      className={cn(
        "flex gap-4 rounded-xl border border-[var(--gs-border)] bg-[var(--gs-surface)] p-4 shadow-sm transition-all hover:shadow-card-hover hover:-translate-y-1 font-onest",
        isActive ? "ring-2 ring-[var(--gs-brand)]" : undefined,
      )}
      prefetch={true}
    >
      <div className="shrink-0 relative h-16 w-24 rounded-[12px] overflow-hidden">
        {university.coverImage ? (
          <Image
            fill
            src={university.coverImage}
            alt={`Campus of ${university.name}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center text-white font-bold text-[13px]"
            style={{ background: coverColor(hue) }}
          >
            {initials}
          </div>
        )}

        {ranking && (
          <span
            className="absolute left-1 top-1 z-20 inline-flex items-center justify-center min-w-[16px] h-5 rounded-full px-1.5 py-0 bg-[rgba(255,255,255,0.92)] text-[10px] font-bold text-[#0f1b3d] shadow-sm"
            title={`Global ranking: #${ranking}`}
          >
            #{ranking}
          </span>
        )}

        <div className="absolute left-1 bottom-1 z-20 h-8 w-8 rounded-[8px] overflow-hidden shadow-sm" style={{ backgroundColor: `hsl(${hue}, 55%, 38%)` }}>
          {university.logo ? (
            <Image
              src={university.logo}
              alt={`${university.name} crest`}
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="h-full w-full flex items-center justify-center text-[9px] font-semibold text-white">
              {initials}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            "absolute right-1 top-1 z-20 rounded-[8px] p-1.5 transition-all duration-200",
            isSaved
              ? "bg-[var(--gs-brand)] text-[var(--gs-brand-text)] shadow-sm"
              : "border border-[var(--gs-border)] bg-[var(--gs-surface)]/90 text-[var(--gs-muted)] shadow-sm hover:bg-[var(--gs-surface)]",
          )}
          aria-label={isSaved ? "Remove from saved universities" : "Save university"}
          aria-pressed={isSaved}
          disabled={isSaving}
        >
          {isSaving ? (
            <svg className="h-4 w-4 animate-spin text-[var(--gs-brand)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isSaved ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <h3 className="text-[17px] font-semibold leading-tight line-clamp-1 mb-1">
          {university.name}
        </h3>

        <p className="flex items-center gap-1.5 text-[12px] text-[var(--gs-muted)] mb-2">
          <span className="truncate" title={countryLabel ?? undefined}>
            {countryLabel}
          </span>
        </p>

        {university.description && (
          <p className="text-[14px] leading-1.5 text-[var(--gs-text)] line-clamp-2 mb-3">
            {university.description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] text-[var(--gs-muted)]">Tuition</span>
            <span className="text-[13px] font-medium text-[var(--gs-text)] truncate">
              {university.tuitionInfo || "\u2014"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] text-[var(--gs-muted)]">Intake</span>
            <span className="text-[13px] font-medium text-[var(--gs-text)] truncate">
              {intakes.length > 0 ? intakes.join(", ") : "\u2014"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] text-[var(--gs-muted)]">Levels</span>
            <span className="text-[13px] font-medium text-[var(--gs-text)] truncate">
              {levels.length > 0 ? levels.join(", ") : "\u2014"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-auto">
          {tags.map((field) => (
            <span
              key={field}
              className="rounded-full border border-[var(--gs-border)] bg-[var(--gs-soft-brand)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--gs-brand)]"
              title={field}
            >
              {field}
            </span>
          ))}
          {university.scholarshipCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gs-success-bg)] bg-[var(--gs-success-bg)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--gs-success-text)]">
              {university.scholarshipCount} scholarship{university.scholarshipCount === 1 ? "" : "s"} available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gs-border)] bg-[var(--gs-muted)]/10 px-3 py-1.5 text-[12.5px] text-[var(--gs-muted)]">
              No scholarships listed
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 flex flex-col gap-2">
        <Link
          href={`/universities/${university.slug ?? university.id}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-transparent bg-[var(--gs-brand)] px-3 py-2 text-[13px] font-medium text-[var(--gs-brand-text)] shadow-sm transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gs-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gs-bg)]"
        >
          View university
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {university.website && (
          <button
            type="button"
            onClick={handleExternalClick}
            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-[var(--gs-border)] bg-[var(--gs-surface)] px-3 py-2 text-[13px] font-medium text-[var(--gs-text)] transition-colors hover:bg-[var(--gs-muted)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gs-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gs-bg)]"
            aria-label={`Official website of ${university.name}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </Link>
  );
}
