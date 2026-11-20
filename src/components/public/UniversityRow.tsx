"use client";

import Link from "next/link";
import { ExternalLink, MapPin, Star, Trophy } from "lucide-react";
import { UniversityImage } from "@/components/public/UniversityImage";
import { CountryFlag } from "@/components/ui/CountryFlag";
import {
  NewlyAddedBadge,
  RankingBadge,
  ScholarshipAvailabilityBadge,
} from "@/components/public/UniversityBadges";
import type { PublicUniversity } from "@/lib/data/public";

interface UniversityRowProps {
  university: PublicUniversity;
}

export function UniversityRow({ university }: UniversityRowProps) {
  const countryLabel =
    university.city && university.country
      ? `${university.city}, ${university.country}`
      : university.country || university.city;

  const handleExternalClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (university.website) window.open(university.website, "_blank", "noopener");
  };

  return (
    <Link
      href={`/universities/${university.slug ?? university.id}`}
      className="flex items-center gap-4 rounded-xl border border-secondary-200 bg-white p-3 transition-all hover:bg-secondary-50 hover:shadow-card"
      prefetch={true}
    >
      <div className="shrink-0 relative">
        <UniversityImage
          src={university.coverImage}
          alt={`Campus of ${university.name}`}
          initials={university.name}
          className="h-16 w-24 object-cover"
        />
        <div className="absolute -right-1 -bottom-1 z-20">
          {university.qsRanking ? (
            <RankingBadge ranking={university.qsRanking} source="qs" />
          ) : university.theRanking ? (
            <RankingBadge ranking={university.theRanking} source="the" />
          ) : null}
        </div>
        <div className="absolute left-0 top-0 z-20">
          <NewlyAddedBadge createdAt={university.createdAt} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <h3 className="text-sm font-bold text-secondary-950 leading-tight line-clamp-1">
            {university.name}
          </h3>
          <NewlyAddedBadge createdAt={university.createdAt} className="text-[9px]" />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-secondary-500 mb-2">
          <CountryFlag
            code={university.countryCode}
            name={university.country}
            size="xs"
          />
          <span className="truncate" title={countryLabel ?? undefined}>{countryLabel}</span>
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 text-xs text-secondary-600">
          <div className="flex items-center gap-1">
            <Trophy className="h-3 w-3 shrink-0 text-secondary-400" />
            <span className="font-medium text-secondary-800">
              {university.qsRanking ? `#${university.qsRanking} QS` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-secondary-300 shrink-0" />
            <span className="font-medium text-secondary-800">
              {university.theRanking ? `#${university.theRanking} THE` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 shrink-0 text-secondary-400" />
            <span className="font-medium text-secondary-800">
              {university.scholarshipCount} scholarships
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-secondary-400" />
            <span className="font-medium text-secondary-800">
              {university.internationalStudentPercent != null
                ? `${university.internationalStudentPercent}% intl`
                : "—"}
            </span>
          </div>
        </div>

        <div className="mt-2.5 text-sm text-secondary-500 line-clamp-1">
          {university.popularFields.slice(0, 3).join(", ") || "No subject areas listed"}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ScholarshipAvailabilityBadge count={university.scholarshipCount} />
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
    </Link>
  );
}