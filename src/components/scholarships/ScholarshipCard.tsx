"use client";

import React from "react";
import Link from "next/link";
import { Bookmark, Layers, GraduationCap, MapPin } from "lucide-react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { useStore } from "@/lib/store/useStore";
import type { PublicScholarship } from "@/lib/data/public";
import {
  formatDate,
  getDeadlineBadgeColor,
  getDeadlineLabel,
  getDeadlineUrgency,
  getVerificationBadge,
} from "@/lib/utils";
import { useNow, daysUntilFrom } from "@/lib/useNow";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ScholarshipCardProps {
  scholarship: PublicScholarship;
  matchScore?: number;
  matchReasons?: string[];
}

export function ScholarshipCard({
  scholarship,
  matchScore,
  matchReasons
}: ScholarshipCardProps) {
  const { isSaved, toggleSaveScholarship, compareIds, toggleCompare, trackApplication } = useStore();
  const saved = isSaved(scholarship.id);
  const isCompared = compareIds.includes(scholarship.id);

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
  const verification = getVerificationBadge(scholarship.verificationStatus);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleSaveScholarship(scholarship.id);
    toast.success(saved ? "Removed from saved" : "Saved to your list");
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isCompared && compareIds.length >= 4) {
      toast.error("You can compare up to 4 scholarships at once");
      return;
    }
    toggleCompare(scholarship.id);
    toast.success(isCompared ? "Removed from compare" : "Added to comparison");
  };

  const handleTrack = (e: React.MouseEvent) => {
    e.preventDefault();
    trackApplication(scholarship);
    toast.success("Added to Application Tracker!");
  };

  const getFundingBadgeStyle = (type: string) => {
    switch (type) {
      case "fully-funded":
        return "bg-success-50 text-success-700 border-success-200 font-semibold";
      case "fully-tuition":
        return "bg-primary-50 text-primary-700 border-primary-200";
      case "partial-tuition":
        return "bg-warning-50 text-warning-700 border-warning-200";
      default:
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-secondary-200/90 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-secondary-300 hover:shadow-card-hover">
      {/* Scholarship Image/Provider Logo */}
      {(scholarship.coverImage || scholarship.logo) && (
        <div className="mb-4 -mx-5 -mt-5 rounded-t-2xl overflow-hidden">
          <img
            src={scholarship.coverImage || scholarship.logo || ""}
            alt={scholarship.providerName || "Scholarship"}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div>
        {/* Top Badges & Meta */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Funding Badge */}
            <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs uppercase tracking-wider ${getFundingBadgeStyle(scholarship.fundingType)}`}>
              {scholarship.fundingType.replace("-", " ")}
            </span>

            {/* Verification Badge */}
            <span
              className="inline-flex items-center gap-1 rounded-md border border-secondary-100 bg-secondary-50 px-2 py-0.5 text-xs text-secondary-600"
              title={`Source: ${scholarship.providerName || "Official Provider"} (Verified ${formatDate(scholarship.lastVerifiedAt)})`}
            >
              <span className="text-[10px]">{verification.icon}</span>
              <span>{verification.label}</span>
            </span>
          </div>

          {/* Match Indicator if present */}
          {matchScore !== undefined && (
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              matchScore >= 80
                ? "bg-success-100 text-success-800"
                : matchScore >= 60
                ? "bg-primary-100 text-primary-800"
                : "bg-warning-100 text-warning-800"
            )}>
              <span>{matchScore}%</span>
              <span>match</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link href={`/scholarships/${scholarship.slug}`} className="group-hover:text-primary-600">
          <h3 className="text-lg font-bold leading-snug text-secondary-900 transition-colors">
            {scholarship.title}
          </h3>
        </Link>

        {/* Provider & University */}
        <p className="mt-1 text-sm text-secondary-600">
          {scholarship.providerName || "Official Organization"}
          {scholarship.universityName && ` • ${scholarship.universityName}`}
        </p>

        {/* Key Info Pills */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-secondary-600 sm:grid-cols-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary-50 p-2">
            <CountryFlag
              code={scholarship.countryCode}
              name={scholarship.countryName ?? undefined}
              size="xs"
            />
            <span className="truncate" title={scholarship.countryName || "Global"}>
              {scholarship.countryName || "Global"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-secondary-50 p-2">
            <GraduationCap className="h-3.5 w-3.5 text-secondary-400 shrink-0" />
            <span className="truncate" title={scholarship.degreeLevels.join(", ")}>
              {scholarship.degreeLevels.join(", ")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-secondary-50 p-2 col-span-2 sm:col-span-1">
            <span
              className={cn(
                "truncate rounded-md px-1.5 py-0.5 font-medium",
                getDeadlineBadgeColor(urgency)
              )}
              title={getDeadlineLabel(urgency)}
            >
              {formatDate(scholarship.deadline)}
            </span>
          </div>
        </div>

        {/* Match Reasons snippet if available */}
        {matchReasons && matchReasons.length > 0 && (
          <div className="mt-3 rounded-lg border border-success-100 bg-success-50/50 p-2.5 text-xs text-success-900">
            <span className="font-semibold text-success-800">Why this matches: </span>
            <span>{matchReasons[0]}</span>
          </div>
        )}

        {/* Short Description */}
        <p className="mt-3 text-xs leading-relaxed text-secondary-500 line-clamp-2">
          {scholarship.description}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 border-t border-secondary-100 pt-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            title={saved ? "Remove from saved" : "Save scholarship"}
            className={cn(
              "rounded-lg p-2 transition-colors",
              saved
                ? "bg-primary-50 text-primary-600"
                : "text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700"
            )}
          >
            <Bookmark className={cn("h-4 w-4", saved ? "fill-primary-600" : "")} />
          </button>

          <button
            onClick={handleCompare}
            title={isCompared ? "Remove from comparison" : "Compare with others"}
            className={cn(
              "rounded-lg p-2 transition-colors",
              isCompared
                ? "bg-indigo-50 text-indigo-600"
                : "text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700"
            )}
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTrack}
            className="rounded-lg border border-secondary-200 px-3 py-1.5 text-xs font-medium text-secondary-700 hover:bg-secondary-50"
          >
            Track
          </button>

          <Link
            href={`/scholarships/${scholarship.slug}`}
            className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
          >
            <span>Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
