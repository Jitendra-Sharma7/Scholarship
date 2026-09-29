import { prisma } from "@/lib/prisma";
import { PER_PAGE } from "@/lib/admin-pagination";

/**
 * Admin inbox for community submissions.
 *
 * Unlike the registry-driven sections, submissions are not content: they are
 * unverified claims waiting for a decision, so the list is organised around
 * review state rather than publish state.
 */

export interface SubmissionFilters {
  q?: string;
  status?: string;
  type?: string;
  trashed?: boolean;
  page?: number;
}

export interface SubmissionRow {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  officialUrl: string | null;
  countryName: string | null;
  deadline: string | null;
  fundingAmount: number | null;
  currency: string | null;
  degreeLevels: string[];
  submitterName: string | null;
  submitterEmail: string | null;
  internalNotes: string | null;
  convertedType: string | null;
  convertedId: string | null;
  reviewerEmail: string | null;
  createdAt: string;
  reviewedAt: string;
  deletedAt: boolean;
}

const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const STAMP = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/** Reads a payload key without trusting its shape. */
function str(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function num(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function list(payload: Record<string, unknown>, key: string): string[] {
  const value = payload[key];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function toRow(raw: {
  id: string;
  type: string;
  status: string;
  payload: unknown;
  submitterName: string | null;
  submitterEmail: string | null;
  internalNotes: string | null;
  convertedType: string | null;
  convertedId: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  deletedAt: Date | null;
  reviewedBy: { email: string } | null;
}): SubmissionRow {
  const payload =
    raw.payload && typeof raw.payload === "object" && !Array.isArray(raw.payload)
      ? (raw.payload as Record<string, unknown>)
      : {};

  const deadline = str(payload, "deadline");

  return {
    id: raw.id,
    type: raw.type,
    status: raw.status,
    title: str(payload, "title") ?? "Untitled submission",
    description: str(payload, "description"),
    officialUrl: str(payload, "officialUrl"),
    countryName: str(payload, "countryName"),
    deadline: deadline ? DAY.format(new Date(deadline)) : null,
    fundingAmount: num(payload, "fundingAmount"),
    currency: str(payload, "currency"),
    degreeLevels: list(payload, "degreeLevels"),
    submitterName: raw.submitterName,
    submitterEmail: raw.submitterEmail,
    internalNotes: raw.internalNotes,
    convertedType: raw.convertedType,
    convertedId: raw.convertedId,
    reviewerEmail: raw.reviewedBy?.email ?? null,
    createdAt: STAMP.format(raw.createdAt),
    reviewedAt: raw.reviewedAt ? STAMP.format(raw.reviewedAt) : "",
    deletedAt: raw.deletedAt != null,
  };
}

export async function listSubmissions(
  filters: SubmissionFilters
): Promise<{ rows: SubmissionRow[]; total: number; page: number; perPage: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const q = filters.q?.trim();

  const where = {
    deletedAt: filters.trashed ? { not: null } : null,
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status as never } : {}),
    ...(filters.type && filters.type !== "ALL" ? { type: filters.type as never } : {}),
    // The submitted title lives inside the JSON payload, so it is matched with a
    // JSON path filter: an admin searching a scholarship name expects to find the
    // submission that mentions it.
    ...(q
      ? {
          OR: [
            { submitterName: { contains: q, mode: "insensitive" as const } },
            { submitterEmail: { contains: q, mode: "insensitive" as const } },
            { internalNotes: { contains: q, mode: "insensitive" as const } },
            { payload: { path: ["title"], string_contains: q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      // Anything unreviewed floats to the top, oldest first, so a backlog is
      // worked through in the order it arrived.
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { reviewedBy: { select: { email: true } } },
    }),
  ]);

  return { rows: rows.map(toRow), total, page, perPage: PER_PAGE };
}

/** Counts per status, for the inbox tabs. */
export async function submissionCounts() {
  const grouped = await prisma.submission.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {
    PENDING: 0,
    UNDER_REVIEW: 0,
    APPROVED: 0,
    REJECTED: 0,
  };
  for (const g of grouped) counts[g.status] = g._count._all;
  counts.ALL = grouped.reduce((sum, g) => sum + g._count._all, 0);
  return counts;
}

export async function getSubmission(id: string) {
  const row = await prisma.submission.findUnique({
    where: { id },
    include: { reviewedBy: { select: { email: true } }, submitter: { select: { email: true } } },
  });
  if (!row) return null;
  return { raw: row, row: toRow(row) };
}
