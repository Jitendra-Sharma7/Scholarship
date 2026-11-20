"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  Globe,
  GraduationCap,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversityImage } from "@/components/public/UniversityImage";
import { CountryFlag } from "@/components/ui/CountryFlag";
import {
  NewlyAddedBadge,
  RankingBadge,
  ScholarshipAvailabilityBadge,
} from "@/components/public/UniversityBadges";
import type { PublicUniversity } from "@/lib/data/public";
import { formatNumber } from "@/lib/utils";

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
  /** Render the image with high priority (first card in the viewport). */
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

  const handleExternalClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (university.website) window.open(university.website, "_blank", "noopener");
  };

  return (
    <Link
      href={`/universities/${university.slug ?? university.id}`}
      onClick={() => {
        // Keep filter state intact: navigating to a profile is a normal push
        // so the browser back button restores the directory with its filters.
      }}
      prefetch={true}
      className="block"
    >
      <article
        className={cn(
          "flex flex-col justify-between rounded-xl border border-secondary-200 bg-white shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1",
          isActive && "ring-2 ring-primary-500 bg-primary-50",
          "min-h-[560px]"
        )}
      >
        {/* Top section: image + badges */}
        <div className="relative overflow-hidden rounded-t-xl">
          <UniversityImage
            src={university.coverImage}
            alt={`Campus of ${university.name}`}
            initials={university.name}
            priority={priority}
            className="w-full h-[240px] object-cover"
          />
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
            <NewlyAddedBadge
              createdAt={university.createdAt}
              className="text-[9px] px-2 py-0.5"
            />
            <div className="flex flex-wrap gap-1.5">
              {university.qsRanking && (
                <RankingBadge
                  ranking={university.qsRanking}
                  source="qs"
                  className="text-[9px] px-2 py-0.5"
                />
              )}
              {university.theRanking && (
                <RankingBadge
                  ranking={university.theRanking}
                  source="the"
                  className="text-[9px] px-2 py-0.5"
                />
              )}
            </div>
          </div>
          <div className="absolute top-3 right-3 z-20">
            <ScholarshipAvailabilityBadge
              count={university.scholarshipCount}
              className="text-[9px] px-2 py-0.5"
            />
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="mb-1.5">
            <h3 className="text-base font-bold text-secondary-950 leading-tight line-clamp-2">
              {university.name}
            </h3>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-secondary-500 mb-3.5">
            <CountryFlag
              code={university.countryCode}
              name={university.country}
              size="xs"
            />
            <span className="truncate" title={countryLabel ?? undefined}>
              {countryLabel}
            </span>
          </p>

          {university.description && (
            <p className="text-sm text-secondary-600 leading-relaxed line-clamp-2 mb-3.5">
              {university.description}
            </p>
          )}

          <div className="space-y-2 mb-auto">
            {university.popularFields.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {university.popularFields.slice(0, 4).map((field) => (
                  <span
                    key={field}
                    className="rounded-md border border-secondary-200 bg-secondary-50 px-2 py-0.5 text-[10px] font-medium text-secondary-600 uppercase tracking-wider"
                    title={field}
                  >
                    {field}
                  </span>
                ))}
              </div>
            )}
            {levels.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-secondary-500">
                <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium text-secondary-700">Study levels:</span>{" "}
                <span className="truncate">
                  {levels.join(", ")}
                </span>
              </div>
            )}
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-secondary-500">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium text-secondary-700">International students:</span>{" "}
              <span>
                {university.internationalStudentPercent != null
                  ? `${university.internationalStudentPercent}%`
                  : "Not available"}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-secondary-500">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium text-secondary-700">Student population:</span>{" "}
              <span>
                {university.studentCount
                  ? formatNumber(university.studentCount)
                  : "Not available"}
              </span>
            </div>
          </div>
        </div>

        <footer className="p-4 border-t border-secondary-100 bg-secondary-50/50 rounded-b-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ScholarshipAvailabilityBadge
                count={university.scholarshipCount}
                className="text-xs px-2.5 py-1"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/universities/${university.slug ?? university.id}`}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-sm"
              >
                View Profile
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              {university.website && (
                <button
                  onClick={handleExternalClick}
                  className="rounded-lg p-2 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-900"
                  aria-label={`Official website of ${university.name}`}
                  title="Official website"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </footer>
      </article>
    </Link>
  );
}