"use client";

import React from "react";
import { ExternalLink, Globe, Building, BookOpen } from "lucide-react";
import type { PublicScholarship } from "@/lib/data/public";

export interface SourceInfo {
  label: string;
  url: string | null;
  icon: React.ReactNode;
}

/**
 * Returns the appropriate official website to display for a scholarship.
 * Priority:
 * 1. University website (if the scholarship is associated with a university)
 * 2. Provider website (for government/external organisation scholarships)
 * 3. null if neither is available
 */
export function getOfficialWebsite(scholarship: PublicScholarship): SourceInfo {
  if (scholarship.universityWebsite) {
    return {
      label: "Official University Website",
      url: scholarship.universityWebsite,
      icon: <Building className="h-4 w-4" />,
    };
  }
  if (scholarship.providerWebsite) {
    return {
      label: "Official Provider Website",
      url: scholarship.providerWebsite,
      icon: <Globe className="h-4 w-4" />,
    };
  }
  return {
    label: "Official Website",
    url: null,
    icon: <BookOpen className="h-4 w-4" />,
  };
}

interface UniversityWebsiteLinkProps {
  scholarship: PublicScholarship;
  size?: "sm" | "md" | "lg";
  variant?: "button" | "inline" | "card";
  showLabel?: boolean;
}

export function UniversityWebsiteLink({
  scholarship,
  size = "md",
  variant = "inline",
  showLabel = true,
}: UniversityWebsiteLinkProps) {
  const source = getOfficialWebsite(scholarship);

  if (!source.url) {
    if (variant === "card") {
      return (
        <div className="rounded-xl border border-secondary-200 bg-white p-5 shadow-xs">
          <h3 className="font-bold text-secondary-900 text-sm border-b border-secondary-100 pb-2 mb-3">
            Official Website
          </h3>
          <p className="text-xs text-secondary-500">
            No official website link is published for this scholarship.
          </p>
        </div>
      );
    }
    return null;
  }

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (variant === "button") {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center ${sizeClasses[size]} rounded-xl bg-primary-600 text-white font-semibold shadow-xs transition-all hover:bg-primary-700 hover:-translate-y-0.5`}
      >
        <span className={iconSizes[size]}>{source.icon}</span>
        <span>{showLabel ? source.label : "Visit"}</span>
        <ExternalLink className={iconSizes[size]} />
      </a>
    );
  }

  if (variant === "card") {
    return (
      <div className="rounded-xl border border-secondary-200 bg-white p-5 shadow-xs">
        <h3 className="font-bold text-secondary-900 text-sm border-b border-secondary-100 pb-2 mb-3">
          Official Website
        </h3>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:underline break-all"
        >
          <span className={iconSizes[size]}>{source.icon}</span>
          <span>{source.label}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      </div>
    );
  }

  // inline variant
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center ${sizeClasses[size]} rounded-lg text-secondary-700 hover:text-primary-600 transition-colors border border-secondary-200 hover:border-primary-200 hover:bg-primary-50/50`}
    >
      <span className={iconSizes[size]}>{source.icon}</span>
      {showLabel && <span className="font-medium">{source.label}</span>}
      <ExternalLink className={iconSizes[size]} />
    </a>
  );
}