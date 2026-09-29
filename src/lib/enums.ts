/**
 * Value mappings between the public site's display strings and the Prisma
 * enum names.
 *
 * Prisma writes enums by NAME (`FULLY_FUNDED`); `@map` only controls what is
 * stored in PostgreSQL. The public website has always used the lowercase
 * hyphenated / spaced display strings, so the DB stores those and every
 * boundary converts with the helpers below.
 *
 * Kept in one place so the seed, the admin UI and the public data layer cannot
 * drift apart.
 */

// Type-only import: erased at build time, so this module stays safe to import
// from client components.
import type {
  DeadlineStatus,
  FundingType,
  StudyMode,
  VerificationStatus,
} from "@prisma/client";

// --- Funding type ---------------------------------------------------------

export const FUNDING_TYPES = [
  "fully-funded",
  "fully-tuition",
  "partial-tuition",
  "stipend",
  "mixed",
] as const;
export type FundingTypeValue = (typeof FUNDING_TYPES)[number];

export const FUNDING_TYPE_LABELS: Record<FundingTypeValue, string> = {
  "fully-funded": "Fully Funded",
  "fully-tuition": "Full Tuition",
  "partial-tuition": "Partial Tuition",
  stipend: "Stipend",
  mixed: "Mixed Funding",
};

const FUNDING_TO_PRISMA: Record<FundingTypeValue, FundingType> = {
  "fully-funded": "FULLY_FUNDED",
  "fully-tuition": "FULLY_TUITION",
  "partial-tuition": "PARTIAL_TUITION",
  stipend: "STIPEND",
  mixed: "MIXED",
};

const FUNDING_FROM_PRISMA: Record<string, FundingTypeValue> = Object.fromEntries(
  Object.entries(FUNDING_TO_PRISMA).map(([k, v]) => [v, k as FundingTypeValue])
);

export function toPrismaFundingType(value: string): FundingType {
  return FUNDING_TO_PRISMA[value as FundingTypeValue] ?? "MIXED";
}

export function fromPrismaFundingType(value: string): FundingTypeValue {
  return FUNDING_FROM_PRISMA[value] ?? "mixed";
}

// --- Verification status --------------------------------------------------

export const VERIFICATION_STATUSES = [
  "Verified Recently",
  "Verification Needed",
  "Potentially Expired",
] as const;
export type VerificationStatusValue = (typeof VERIFICATION_STATUSES)[number];

const VERIFICATION_TO_PRISMA: Record<VerificationStatusValue, VerificationStatus> = {
  "Verified Recently": "VERIFIED_RECENTLY",
  "Verification Needed": "VERIFICATION_NEEDED",
  "Potentially Expired": "POTENTIALLY_EXPIRED",
};

const VERIFICATION_FROM_PRISMA: Record<string, VerificationStatusValue> = Object.fromEntries(
  Object.entries(VERIFICATION_TO_PRISMA).map(([k, v]) => [v, k as VerificationStatusValue])
);

export function toPrismaVerificationStatus(value: string): VerificationStatus {
  return VERIFICATION_TO_PRISMA[value as VerificationStatusValue] ?? "VERIFICATION_NEEDED";
}

export function fromPrismaVerificationStatus(value: string): VerificationStatusValue {
  return VERIFICATION_FROM_PRISMA[value] ?? "Verification Needed";
}

// --- Deadline status ------------------------------------------------------

export const DEADLINE_STATUSES = [
  "Upcoming",
  "Opening Soon",
  "Open",
  "Closing Soon",
  "Closed",
  "Expired",
] as const;
export type DeadlineStatusValue = (typeof DEADLINE_STATUSES)[number];

const DEADLINE_TO_PRISMA: Record<DeadlineStatusValue, DeadlineStatus> = {
  Upcoming: "UPCOMING",
  "Opening Soon": "OPENING_SOON",
  Open: "OPEN",
  "Closing Soon": "CLOSING_SOON",
  Closed: "CLOSED",
  Expired: "EXPIRED",
};

const DEADLINE_FROM_PRISMA: Record<string, DeadlineStatusValue> = Object.fromEntries(
  Object.entries(DEADLINE_TO_PRISMA).map(([k, v]) => [v, k as DeadlineStatusValue])
);

export function toPrismaDeadlineStatus(value: string): DeadlineStatus {
  return DEADLINE_TO_PRISMA[value as DeadlineStatusValue] ?? "UPCOMING";
}

export function fromPrismaDeadlineStatus(value: string): DeadlineStatusValue {
  return DEADLINE_FROM_PRISMA[value] ?? "Upcoming";
}

// --- Publish status -------------------------------------------------------

export const PUBLISH_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type PublishStatusValue = (typeof PUBLISH_STATUSES)[number];

// --- Study mode -----------------------------------------------------------

export const STUDY_MODES = ["On Campus", "Online", "Hybrid", "In Person"] as const;
export type StudyModeValue = (typeof STUDY_MODES)[number];

const STUDY_TO_PRISMA: Record<StudyModeValue, StudyMode> = {
  "On Campus": "ON_CAMPUS",
  Online: "ONLINE",
  Hybrid: "HYBRID",
  "In Person": "IN_PERSON",
};

const STUDY_FROM_PRISMA: Record<string, StudyModeValue> = Object.fromEntries(
  Object.entries(STUDY_TO_PRISMA).map(([k, v]) => [v, k as StudyModeValue])
);

export function toPrismaStudyMode(value: string | null | undefined): StudyMode | null {
  if (!value) return null;
  return STUDY_TO_PRISMA[value as StudyModeValue] ?? null;
}

export function fromPrismaStudyMode(value: string | null | undefined): StudyModeValue | null {
  if (!value) return null;
  return STUDY_FROM_PRISMA[value] ?? null;
}

// --- Degree levels --------------------------------------------------------

/**
 * Degree levels are stored free-form because the real dataset contains values
 * such as JD, MD and MBA that no closed list covers. The admin editor suggests
 * these but accepts anything.
 */
export const SUGGESTED_DEGREE_LEVELS = [
  "High School",
  "Undergraduate",
  "Master's",
  "PhD",
  "Postdoctoral",
  "Research",
  "MBA",
  "MD",
  "JD",
] as const;

// --- Roles ----------------------------------------------------------------

export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;
export type AdminRoleValue = (typeof ADMIN_ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
  USER: "User",
};

/** Ordered strongest first; used for `>=` permission checks. */
export const ROLE_RANK: Record<string, number> = {
  USER: 0,
  EDITOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};
