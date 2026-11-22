"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Bookmark, MapPin, GraduationCap, ExternalLink } from "lucide-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { useStore } from "@/lib/store/useStore";
import type { PublicScholarship } from "@/lib/data/public";
import { formatDate, getDeadlineBadgeColor, getDeadlineLabel, getDeadlineUrgency } from "@/lib/utils";
import { useNow, daysUntilFrom } from "@/lib/useNow";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface DirectoryScholarshipCardProps {
  scholarship: PublicScholarship;
  viewMode?: "grid" | "list";
}

export function DirectoryScholarshipCard({ scholarship, viewMode = "grid" }: DirectoryScholarshipCardProps) {
  const { isSaved, toggleSaveScholarship } = useStore();
  const saved = isSaved(scholarship.id);

  const now = useNow();
  const daysLeft = now === null ? null : daysUntilFrom(now, scholarship.deadline);
  const urgency: ReturnType<typeof getDeadlineUrgency> =
    daysLeft === null
      ? "unknown"
      : daysLeft < 0
        ? "closed"
        : daysLeft <= 7
          ? "urgent"
          : daysLeft <= 15
            ? "soon"
            : daysLeft <= 30
              ? "warning"
              : "safe";

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaveScholarship(scholarship.id);
    toast.success(saved ? "Removed from saved" : "Saved to your list");
  };

  const getFundingBadgeStyle = (type: string) => {
    switch (type) {
      case "fully-funded":
        return "bg-success-50 text-success-700 border-success-200 font-semibold";
      case "fully-tuition":
        return "bg-primary-50 text-primary-700 border-primary-200";
      case "partial-tuition":
        return "bg-warning-50 text-warning-700 border-warning-200";
      case "stipend":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-secondary-100 text-secondary-700 border-secondary-200";
    }
  };

  const formatFundingType = (type: string) => {
    return type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const cardContent = (
    <>
      {/* Image */}
      {(scholarship.coverImage || scholarship.logo) && (
        <div className="relative w-full h-48 lg:w-64 lg:h-auto shrink-0 rounded-xl overflow-hidden">
          <Image
            src={scholarship.coverImage || scholarship.logo || ""}
            alt={scholarship.providerName || scholarship.universityName || "Scholarship"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            width={320}
            height={180}
            style={{ objectFit: "cover" }}
          />
          {/* Wishlist Heart */}
          <button
            onClick={handleSave}
            className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5 shadow-md transition-all hover:bg-white hover:scale-110"
            aria-label={saved ? "Remove from saved" : "Save scholarship"}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                saved ? "text-primary-600" : "text-secondary-600"
              )}
              fill={saved ? "currentColor" : "none"}
              stroke={saved ? "none" : "currentColor"}
            />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-5">
        {/* Top Badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {/* Funding Badge */}
          <span className={cn(
            "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs uppercase tracking-wider",
            getFundingBadgeStyle(scholarship.fundingType)
          )}>
            {formatFundingType(scholarship.fundingType)}
          </span>

          {/* Degree Level Badge */}
          {scholarship.degreeLevels.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary-50 border border-secondary-200 px-2.5 py-0.5 text-xs font-medium text-secondary-700">
              <GraduationCap className="h-3 w-3" />
              {scholarship.degreeLevels[0]}
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/scholarships/${scholarship.slug}`} className="group">
          <h3 className="text-lg font-bold leading-snug text-secondary-900 transition-colors group-hover:text-primary-600 line-clamp-2">
            {scholarship.title}
          </h3>
        </Link>

        {/* Provider & University */}
        <p className="mt-1.5 text-sm text-secondary-600">
          {scholarship.providerName || "Official Organization"}
          {scholarship.universityName && ` • ${scholarship.universityName}`}
        </p>

        {/* Key Info */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-secondary-600">
          <div className="flex items-center gap-1.5">
            <CountryFlag
              code={scholarship.countryCode}
              name={scholarship.countryName ?? undefined}
              size="sm"
            />
            <span className="font-medium text-secondary-700">{scholarship.countryName || "Global"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-secondary-400" />
            <span>{scholarship.degreeLevels.join(", ")}</span>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 font-medium",
            getDeadlineBadgeColor(urgency)
          )} title={getDeadlineLabel(urgency)}>
            <span>{formatDate(scholarship.deadline)}</span>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-secondary-500 line-clamp-3">
          {scholarship.shortDescription || scholarship.description || "Explore this scholarship opportunity for international students."}
        </p>

        {/* Footer Actions */}
        <div className="mt-auto pt-4 border-t border-secondary-100 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              className={cn(
                "rounded-lg p-2 transition-colors",
                saved
                  ? "bg-primary-50 text-primary-600"
                  : "text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700"
              )}
              aria-label={saved ? "Remove from saved" : "Save scholarship"}
            >
              <Bookmark
                className={cn("h-5 w-5", saved && "fill-current")}
                fill={saved ? "currentColor" : "none"}
              />
            </button>
          </div>

          <Link
            href={`/scholarships/${scholarship.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
          >
            <span>View Details</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );

  if (viewMode === "list") {
    return (
      <article className="group relative flex flex-row gap-5 rounded-2xl border border-secondary-200/90 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-secondary-300 hover:shadow-card-hover">
        {cardContent}
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col rounded-2xl border border-secondary-200/90 bg-white overflow-hidden shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-secondary-300 hover:shadow-card-hover">
      {cardContent}
    </article>
  );
}