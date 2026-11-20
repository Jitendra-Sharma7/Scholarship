"use client";

import React from "react";
import { ShieldCheck, AlertCircle, Clock, ExternalLink, FileText, Globe } from "lucide-react";
import type { PublicScholarship } from "@/lib/data/public";

export interface VerificationInfo {
  label: string;
  description: string;
  icon: React.ReactNode;
  variant: "success" | "warning" | "error" | "neutral";
  color: string;
  bgColor: string;
  borderColor: string;
}

const VERIFICATION_INFO: Record<string, VerificationInfo> = {
  "Verified Recently": {
    label: "Verified",
    description: "Confirmed against official source within the last 30 days",
    icon: <ShieldCheck className="h-4 w-4" />,
    variant: "success",
    color: "text-success-700",
    bgColor: "bg-success-50",
    borderColor: "border-success-200",
  },
  "Verification Needed": {
    label: "Verify",
    description: "Awaiting editorial verification against official source",
    icon: <Clock className="h-4 w-4" />,
    variant: "warning",
    color: "text-warning-700",
    bgColor: "bg-warning-50",
    borderColor: "border-warning-200",
  },
  "Potentially Expired": {
    label: "Expired?",
    description: "Deadline may have passed; verification recommended",
    icon: <AlertCircle className="h-4 w-4" />,
    variant: "error",
    color: "text-error-700",
    bgColor: "bg-error-50",
    borderColor: "border-error-200",
  },
  "Verified": {
    label: "Verified",
    description: "Confirmed against official source",
    icon: <ShieldCheck className="h-4 w-4" />,
    variant: "success",
    color: "text-success-700",
    bgColor: "bg-success-50",
    borderColor: "border-success-200",
  },
};

export function getVerificationInfo(status: string): VerificationInfo {
  return VERIFICATION_INFO[status] || {
    label: status,
    description: "Status information not available",
    icon: <FileText className="h-4 w-4" />,
    variant: "neutral",
    color: "text-secondary-700",
    bgColor: "bg-secondary-100",
    borderColor: "border-secondary-200",
  };
}

interface VerificationBadgeProps {
  scholarship: PublicScholarship;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  showSourceLink?: boolean;
}

export function VerificationBadge({
  scholarship,
  size = "md",
  showDetails = false,
  showSourceLink = false,
}: VerificationBadgeProps) {
  const verification = getVerificationInfo(scholarship.verificationStatus);
  const isVerified = verification.variant === "success";

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

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "Not available";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Main Badge */}
      <div
        className={`inline-flex items-center ${sizeClasses[size]} rounded-xl border font-semibold ${verification.bgColor} ${verification.borderColor} ${verification.color}`}
      >
        <span className={iconSizes[size]}>{verification.icon}</span>
        <span className="font-medium">{verification.label}</span>
        {showSourceLink && (scholarship.officialUrl || scholarship.applicationUrl) && (
          <a
            href={scholarship.officialUrl ?? scholarship.applicationUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center text-secondary-500 hover:text-primary-600 transition-colors"
            aria-label="View official source"
          >
            <ExternalLink className={iconSizes[size]} />
          </a>
        )}
      </div>

      {/* Details Tooltip/Expansion */}
      {showDetails && (
        <div className="rounded-xl border bg-white p-3 shadow-sm animate-fade-in">
          <div className="space-y-2 text-sm text-secondary-700">
            <div className="flex items-center gap-2">
              <span className="font-medium text-secondary-900">Status:</span>
              <span>{verification.description}</span>
            </div>

            {scholarship.lastVerifiedAt && (
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-secondary-400" />
                <span className="font-medium text-secondary-900">Last Verified:</span>
                <span>{formatDate(scholarship.lastVerifiedAt)}</span>
              </div>
            )}

            {scholarship.officialUrl && (
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-secondary-400" />
                <span className="font-medium text-secondary-900">Official Source:</span>
                <a
                  href={scholarship.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline break-all"
                >
                  {scholarship.officialUrl}
                </a>
              </div>
            )}

            {!isVerified && (
              <div className="mt-2 p-2 rounded-lg bg-warning-50 border border-warning-200">
                <div className="flex items-start gap-2 text-xs text-warning-800">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Important:</strong> This scholarship has not been recently verified. Always confirm
                    eligibility, deadlines, and requirements directly with the official provider before applying.
                  </span>
                </div>
              </div>
            )}

            {isVerified && (
              <div className="mt-2 p-2 rounded-lg bg-success-50 border border-success-200">
                <div className="flex items-start gap-2 text-xs text-success-800">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    This scholarship was verified against the official source on the date shown above.
                    We recommend double-checking the official website for any updates.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface VerificationInlineProps {
  scholarship: PublicScholarship;
  size?: "sm" | "md";
}

export function VerificationInline({ scholarship, size = "md" }: VerificationInlineProps) {
  const verification = getVerificationInfo(scholarship.verificationStatus);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-0.5",
    md: "px-2.5 py-1 text-xs gap-1",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
  };

  return (
    <span
      className={`inline-flex items-center ${sizeClasses[size]} rounded-full border font-semibold ${verification.bgColor} ${verification.borderColor} ${verification.color}`}
      title={verification.description}
    >
      <span className={iconSizes[size]}>{verification.icon}</span>
      <span>{verification.label}</span>
      {scholarship.lastVerifiedAt && (
        <>
          <span className="text-[10px] opacity-70">•</span>
          <span className="text-[10px]">Verified {new Date(scholarship.lastVerifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}</span>
        </>
      )}
    </span>
  );
}

interface VerificationStatusIndicatorProps {
  scholarship: PublicScholarship;
}

export function VerificationStatusIndicator({ scholarship }: VerificationStatusIndicatorProps) {
  const verification = getVerificationInfo(scholarship.verificationStatus);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border font-medium text-sm ${verification.bgColor} ${verification.borderColor} ${verification.color}`}
      >
        <span className="h-4 w-4">{verification.icon}</span>
        <span>{verification.label}</span>
      </span>
      {scholarship.lastVerifiedAt && (
        <span className="text-xs text-secondary-500">
          Last verified: {new Date(scholarship.lastVerifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      )}
      {scholarship.officialUrl && (
        <a
          href={scholarship.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Official Source</span>
        </a>
      )}
    </div>
  );
}