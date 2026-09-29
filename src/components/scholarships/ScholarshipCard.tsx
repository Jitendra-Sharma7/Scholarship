"use client";

import React from "react";
import Link from "next/link";
import { Bookmark, Layers } from "lucide-react";
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

  // Country, provider and university names travel with the record, so the card
  // needs no client-side lookup table.

  // Null until mounted, so the deadline badge renders identically on the server
  // pass and after hydration. Urgency is derived from the same `daysLeft` value
  // rather than re-reading the clock, so the colour and the countdown agree.
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
        return "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
      case "fully-tuition":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "partial-tuition":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">
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
              className="inline-flex items-center gap-1 rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs text-gray-600"
              title={`Source: ${scholarship.providerName || "Official Provider"} (Verified ${formatDate(scholarship.lastVerifiedAt)})`}
            >
              <span className="text-[10px]">{verification.icon}</span>
              <span>{verification.label}</span>
            </span>
          </div>

          {/* Match Indicator if present */}
          {matchScore !== undefined && (
            <div className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              matchScore >= 80
                ? "bg-emerald-100 text-emerald-800"
                : matchScore >= 60
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
            }`}>
              <span>{matchScore}%</span>
              <span>match</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link href={`/scholarships/${scholarship.slug}`} className="group-hover:text-primary-600">
          <h3 className="text-lg font-bold leading-snug text-gray-900 transition-colors">
            {scholarship.title}
          </h3>
        </Link>

        {/* Provider & University */}
        <p className="mt-1 text-sm text-gray-600">
          {scholarship.providerName || "Official Organization"}
          {scholarship.universityName && ` • ${scholarship.universityName}`}
        </p>

        {/* Key Info Pills */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2">
            <CountryFlag
              code={scholarship.countryCode}
              name={scholarship.countryName ?? undefined}
              size="xs"
            />
            <span className="truncate" title={scholarship.countryName || "Global"}>
              {scholarship.countryName || "Global"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2">
            <span className="truncate" title={scholarship.degreeLevels.join(", ")}>
              {scholarship.degreeLevels.join(", ")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2 col-span-2 sm:col-span-1">
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
          <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5 text-xs text-emerald-900">
            <span className="font-semibold text-emerald-800">Why this matches: </span>
            <span>{matchReasons[0]}</span>
          </div>
        )}

        {/* Short Description */}
        <p className="mt-3 text-xs leading-relaxed text-gray-500 line-clamp-2">
          {scholarship.description}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 border-t border-gray-100 pt-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            title={saved ? "Remove from saved" : "Save scholarship"}
            className={`rounded-lg p-2 transition-colors ${
              saved
                ? "bg-primary-50 text-primary-600"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-primary-600" : ""}`} />
          </button>

          <button
            onClick={handleCompare}
            title={isCompared ? "Remove from comparison" : "Compare with others"}
            className={`rounded-lg p-2 transition-colors ${
              isCompared
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTrack}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
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
