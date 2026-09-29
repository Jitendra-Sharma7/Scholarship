import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PER_PAGE } from "@/lib/admin-pagination";

/**
 * Admin-facing scholarship queries.
 *
 * Filtering, sorting, and pagination all run in the database so the browser only
 * ever receives the 20 rows currently on screen. Every list query defaults to
 * excluding trashed records; the trash view opts in explicitly.
 */

export type ScholarshipListFilters = {
  q?: string;
  status?: string; // publishStatus
  deadline?: string; // derived deadlineStatus
  fundingType?: string;
  countryId?: string;
  fieldId?: string;
  featured?: "yes" | "no";
  fullyFunded?: "yes" | "no";
  verification?: string;
  trashed?: boolean;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
};

const SORTABLE = {
  title: "title",
  deadline: "deadline",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deadlineStatus: "deadlineStatus",
  publishStatus: "publishStatus",
  country: "countryNameLegacy",
} as const;

export type SortKey = keyof typeof SORTABLE;

function buildWhere(filters: ScholarshipListFilters): Prisma.ScholarshipWhereInput {
  const where: Prisma.ScholarshipWhereInput = {
    // Trash is opt-in: an accidental filter must not hide live content.
    deletedAt: filters.trashed ? { not: null } : null,
  };

  const q = filters.q?.trim();
  if (q) {
    // Case-insensitive contains across the fields an editor would search by.
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { shortTitle: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { universityNameLegacy: { contains: q, mode: "insensitive" } },
      { countryNameLegacy: { contains: q, mode: "insensitive" } },
      { provider: { name: { contains: q, mode: "insensitive" } } },
      { university: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (filters.status) where.publishStatus = filters.status as Prisma.EnumPublishStatusFilter["equals"];
  if (filters.deadline) where.deadlineStatus = filters.deadline as never;
  if (filters.fundingType) where.fundingType = filters.fundingType as never;
  if (filters.verification) where.verificationStatus = filters.verification as never;
  if (filters.countryId) where.countryId = filters.countryId;
  if (filters.featured) where.featured = filters.featured === "yes";
  if (filters.fullyFunded) where.isFullyFunded = filters.fullyFunded === "yes";
  if (filters.fieldId) where.fields = { some: { fieldId: filters.fieldId } };

  return where;
}

export interface ScholarshipListRow {
  id: string;
  title: string;
  slug: string;
  publishStatus: string;
  deadlineStatus: string;
  fundingType: string;
  isFullyFunded: boolean;
  featured: boolean;
  verificationStatus: string;
  deadline: Date | null;
  updatedAt: Date;
  createdAt: Date;
  countryName: string | null;
  universityName: string | null;
  fieldNames: string[];
  fieldCount: number;
}

export async function listScholarships(
  filters: ScholarshipListFilters
): Promise<{ rows: ScholarshipListRow[]; total: number; page: number; perPage: number }> {
  const where = buildWhere(filters);

  const sortKey = (filters.sort && filters.sort in SORTABLE ? filters.sort : "updatedAt") as SortKey;
  const dir = filters.dir ?? "desc";

  // Nulls-last is left to Postgres' default; an undated scholarship is not more
  // urgent than a dated one, and ascending-by-deadline naturally trails them.
  const orderBy = {
    [SORTABLE[sortKey]]: dir,
  } as Prisma.ScholarshipOrderByWithRelationInput;

  const page = Math.max(1, filters.page ?? 1);

  const [total, rows] = await prisma.$transaction([
    prisma.scholarship.count({ where }),
    prisma.scholarship.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        title: true,
        slug: true,
        publishStatus: true,
        deadlineStatus: true,
        fundingType: true,
        isFullyFunded: true,
        featured: true,
        verificationStatus: true,
        deadline: true,
        createdAt: true,
        updatedAt: true,
        countryNameLegacy: true,
        universityNameLegacy: true,
        country: { select: { name: true } },
        university: { select: { name: true } },
        fields: { select: { field: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      publishStatus: r.publishStatus,
      deadlineStatus: r.deadlineStatus,
      fundingType: r.fundingType,
      isFullyFunded: r.isFullyFunded,
      featured: r.featured,
      verificationStatus: r.verificationStatus,
      deadline: r.deadline,
      updatedAt: r.updatedAt,
      createdAt: r.createdAt,
      countryName: r.country?.name ?? r.countryNameLegacy ?? null,
      universityName: r.university?.name ?? r.universityNameLegacy ?? null,
      fieldNames: r.fields.map((f) => f.field.name),
      fieldCount: r.fields.length,
    })),
    total,
    page,
    perPage: PER_PAGE,
  };
}

/** Distinct deadline statuses actually present, so filters never offer a dead option. */
export async function getScholarshipFilterOptions() {
  const [countries, deadlineStatuses, fundingTypes, verification] = await Promise.all([
    prisma.country.findMany({
      where: { deletedAt: null, scholarships: { some: { deletedAt: null } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
      take: 300,
    }),
    prisma.scholarship.groupBy({
      by: ["deadlineStatus"],
      where: { deletedAt: null },
      _count: true,
      orderBy: { deadlineStatus: "asc" },
    }),
    prisma.scholarship.groupBy({
      by: ["fundingType"],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.scholarship.groupBy({
      by: ["verificationStatus"],
      where: { deletedAt: null },
      _count: true,
    }),
  ]);

  return {
    countries,
    deadlineStatuses,
    fundingTypes,
    verification,
  };
}

/** Everything the editor needs for its selects, loaded once per page render. */
export async function getEditorReferenceData() {
  const [countries, universities, providers, fields] = await Promise.all([
    prisma.country.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.university.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, countryId: true },
    }),
    prisma.provider.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.field.findMany({
      where: { deletedAt: null },
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
  ]);

  return { countries, universities, providers, fields };
}
