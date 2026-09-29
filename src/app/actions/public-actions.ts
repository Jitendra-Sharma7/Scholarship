"use server";

/**
 * Public read access for client components.
 *
 * The browser never calls `/api/public/*`. Server components import
 * `lib/data/public` directly, and a client component that genuinely needs data
 * it cannot have at request time - the comparison list, saved scholarship ids
 * from local storage, an eligibility match the user just requested - calls one
 * of these instead.
 *
 * A server action is a signed, same-origin RSC call rather than an open JSON
 * endpoint: it cannot be discovered, probed, or fetched by anything but this
 * application. The `/api/public/*` routes stay in place for external consumers
 * and for the verification scripts, but no component depends on them.
 *
 * Every function here re-runs the same visibility rules as the pages:
 * published, not soft-deleted, and with a deadline that has not passed unless an
 * override holds it open. A client component cannot widen that by asking a
 * different question.
 */
import {
  getPublicCountries,
  getPublicFields,
  getPublicProviders,
  getPublicScholarshipById,
  getPublicScholarships,
  getPublicStats,
  getPublicUniversities,
  type ScholarshipQuery,
  type PublicCountry,
  type PublicField,
  type PublicProvider,
  type PublicScholarship,
  type PublicStats,
  type PublicUniversity,
  type Paginated,
} from "@/lib/data/public";
import {
  findMatches,
  type MatchProfile,
  type MatchResult,
} from "@/lib/data/store";

/**
 * Upper bounds, so a client component cannot turn a public read action into an
 * unrestricted table scan. These sit above what the UI actually asks for.
 */
const MAX_LIMIT = 60;
const MAX_LOOKUPS = 20;

function clampLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) return 12;
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT);
}

function allowlisted<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

const SORTS = ["deadline", "newest", "title", "featured"] as const;

function sanitiseFilters(input: Partial<ScholarshipQuery>): ScholarshipQuery {
  return {
    query: input.query?.slice(0, 200) || undefined,
    country: input.country?.slice(0, 80) || undefined,
    field: input.field?.slice(0, 120) || undefined,
    degree: input.degree?.slice(0, 80) || undefined,
    funding: input.funding?.slice(0, 40) || undefined,
    status: input.status?.slice(0, 40) || undefined,
    page: typeof input.page === "number" && input.page > 0 ? Math.trunc(input.page) : 1,
    limit: clampLimit(input.limit),
    sort: allowlisted(input.sort, SORTS),
  };
}

export async function fetchPublicScholarships(
  filters: Partial<ScholarshipQuery>
): Promise<Paginated<PublicScholarship>> {
  return getPublicScholarships(sanitiseFilters(filters));
}

export async function fetchPublicScholarship(id: string): Promise<PublicScholarship | null> {
  const trimmed = id?.slice(0, 80);
  if (!trimmed) return null;
  return getPublicScholarshipById(trimmed);
}

/** Batched lookup for ids the browser already holds, such as saved or compared. */
export async function fetchPublicScholarshipsByIds(ids: string[]): Promise<PublicScholarship[]> {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const wanted = [...new Set(ids.map((id) => String(id).slice(0, 80)).filter(Boolean))].slice(0, MAX_LOOKUPS);
  const found = await Promise.all(wanted.map((id) => getPublicScholarshipById(id)));
  // Keep the caller's ordering; a missing id is dropped rather than turned into
  // a placeholder the UI would have to special-case.
  return found.filter((s): s is PublicScholarship => s !== null);
}

export async function fetchPublicCountries(): Promise<PublicCountry[]> {
  return getPublicCountries();
}

export async function fetchPublicFields(): Promise<PublicField[]> {
  return getPublicFields();
}

export async function fetchPublicUniversities(limit?: number): Promise<PublicUniversity[]> {
  return getPublicUniversities(clampLimit(limit));
}

export async function fetchPublicProviders(): Promise<PublicProvider[]> {
  return getPublicProviders();
}

export async function fetchPublicStats(): Promise<PublicStats> {
  return getPublicStats();
}

export async function runEligibilityMatch(profile: MatchProfile): Promise<MatchResult[]> {
  return findMatches({
    degreeLevel: profile?.degreeLevel?.slice(0, 60),
    field: profile?.field?.slice(0, 120),
    citizenship: profile?.citizenship?.slice(0, 80),
    targetCountries: Array.isArray(profile?.targetCountries)
      ? profile.targetCountries.slice(0, 20).map((c) => String(c).slice(0, 80))
      : undefined,
    gpa: profile?.gpa ?? null,
    languageScore: profile?.languageScore?.slice(0, 60),
    needFullFunding: Boolean(profile?.needFullFunding),
    startYear: profile?.startYear?.slice(0, 20),
    experience: profile?.experience?.slice(0, 200),
    priority: profile?.priority?.slice(0, 200),
  });
}
