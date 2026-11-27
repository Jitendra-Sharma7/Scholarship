"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Bookmark, BookmarkCheck, ExternalLink, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicUniversity } from "@/lib/data/public";
import { useStore } from "@/lib/store/useStore";
import { CountryFlag } from "@/components/ui/CountryFlag";

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

interface UniversityCardProps {
  university: PublicUniversity;
}

export function UniversityCard({ university }: UniversityCardProps) {
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

  const initials = university.name
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "U";

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

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[18px] border border-[#D4AF37] bg-[#FFFFFF] shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-2 font-onest",
        isActive && "ring-2 ring-[#1747D1]",
      )}
    >
      {/* Campus cover image */}
      <div className="relative h-[150px] overflow-hidden">
        {university.coverImage ? (
          <Image
            fill
            src={university.coverImage}
            alt={`Campus of ${university.name}`}
            priority={false}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center text-white font-bold text-[20px]"
            style={{ background: coverColor(hue) }}
          >
            {initials}
          </div>
        )}

        {ranking && (
          <span
            className="absolute left-4 top-4 z-20 inline-flex items-center justify-center min-w-[26px] h-7 rounded-full px-2 py-0.5 bg-[#FFFFFF]/95 text-[11px] font-bold text-[#0f1b3d] shadow-sm border border-[#FFFFFF]/60"
            title={`Global ranking: #${ranking}`}
          >
            #{ranking}
          </span>
        )}

        <div className="absolute left-4 bottom-4 z-20 h-12 w-12 rounded-[14px] overflow-hidden shadow-sm border-2 border-[#FFFFFF]" style={{ backgroundColor: `#FFFFFF` }}>
          {university.logo ? (
            <Image
              src={university.logo}
              alt={`${university.name} crest`}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="h-full w-full flex items-center justify-center text-[11px] font-bold text-[#15264A]">
              {initials}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            "absolute right-4 top-4 z-20 rounded-[10px] p-2 transition-all duration-200",
            isSaved
              ? "bg-[#1747D1] text-[#FFFFFF] shadow-sm"
              : "border border-[#E2E8F0] bg-[#FFFFFF]/95 text-[#64748B] shadow-sm hover:bg-[#FFFFFF]",
          )}
          aria-label={isSaved ? "Remove from saved universities" : "Save university"}
          aria-pressed={isSaved}
          disabled={isSaving}
        >
          {isSaving ? (
            <svg className="h-5 w-5 animate-spin text-[#1747D1]" fill="none" viewBox="0 0 24 24">
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

      <div className="flex-1 flex-col p-5">
        <Link
          href={`/universities/${university.slug ?? university.id}`}
          className={cn(
            "text-[#15264A] hover:text-[#1747D1] transition-colors",
            isActive ? "text-[#1747D1]" : undefined,
          )}
        >
          <h3 className="text-[16px] font-bold leading-tight line-clamp-2 mb-2">
            {university.name}
          </h3>
        </Link>

        <p className="flex items-center gap-1.5 text-[12px] text-[#64748B] mb-3">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate" title={countryLabel ?? undefined}>
            {countryLabel}
          </span>
          {university.countryCode && (
            <CountryFlag code={university.countryCode} name={university.country} size="xs" className="ml-1" />
          )}
        </p>

        {university.description && (
          <p className="text-[13px] leading-1.5 text-[#15264A] line-clamp-2 mb-4">
            {university.description}
          </p>
        )}

        {/* Info grid: ranking, tuition, courses, scholarships */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider">Ranking</span>
            <span className="text-[13px] font-bold text-[#15264A]">
              {ranking ? `#${ranking}` : "\u2014"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider">Tuition/yr</span>
            <span className="text-[13px] font-bold text-[#15264A] truncate">
              {university.tuitionInfo || "\u2014"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider">Courses</span>
            <span className="text-[13px] font-bold text-[#15264A]">
              {university.popularFields.length}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider">Scholarships</span>
            <span className="text-[13px] font-bold text-[#15264A]">
              {university.scholarshipCount}
            </span>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {tags.map((field) => (
              <span
                key={field}
                className="rounded-full border border-[#E2E8F0] bg-[#EAF2FF] px-2.5 py-0.5 text-[11px] font-medium text-[#1747D1]"
                title={field}
              >
                {field}
              </span>
            ))}
          </div>
        )}

        {/* Levels + intakes chips */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {levels.slice(0, 2).map((level) => (
            <span
              key={level}
              className="rounded-full border border-[#E2E8F0] bg-[#FFFFFF] px-2.5 py-0.5 text-[11px] text-[#64748B]"
            >
              {level}
            </span>
          ))}
          {intakes.slice(0, 1).map((intake) => (
            <span
              key={intake}
              className="rounded-full border border-[#E2E8F0] bg-[#FFFFFF] px-2.5 py-0.5 text-[11px] text-[#64748B]"
            >
              {intake}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <Link
          href={`/universities/${university.slug ?? university.id}`}
          className="flex items-center justify-center gap-1.5 rounded-[12px] border border-[#1747D1] bg-[#1747D1] px-4 py-2.5 text-[13px] font-semibold text-[#FFFFFF] shadow-sm transition-all hover:bg-[#102B63] hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1747D1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF]"
        >
          View Details <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {university.website && (
          <button
            type="button"
            onClick={handleExternalClick}
            className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-[12px] border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-2.5 text-[13px] font-semibold text-[#15264A] transition-all hover:bg-[#F3F7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1747D1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF]"
            aria-label={`Apply now at ${university.name}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Apply Now
          </button>
        )}
      </div>
    </article>
  );
}
