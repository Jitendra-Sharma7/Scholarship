import { prisma } from "@/lib/prisma";
import { PER_PAGE } from "@/lib/admin-pagination";

/**
 * Read-only audit trail.
 *
 * Nothing here is editable: an activity log that staff can rewrite is not an
 * audit trail. The one mutation available is retention, and that is deliberately
 * absent rather than quietly implemented.
 */

export interface ActivityFilters {
  q?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
}

export interface ActivityRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  actorEmail: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const STAMP = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

function parseDate(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const d = new Date(endOfDay ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function listActivity(
  filters: ActivityFilters
): Promise<{ rows: ActivityRow[]; total: number; page: number; perPage: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const q = filters.q?.trim();
  const from = parseDate(filters.from);
  const to = parseDate(filters.to, true);

  const where = {
    ...(filters.action ? { action: { startsWith: filters.action } } : {}),
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(filters.actorId ? { actorId: filters.actorId } : {}),
    ...(from || to
      ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
    ...(q
      ? {
          OR: [
            { summary: { contains: q, mode: "insensitive" as const } },
            { action: { contains: q, mode: "insensitive" as const } },
            { actorEmail: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      summary: r.summary,
      actorEmail: r.actorEmail,
      ipAddress: r.ipAddress,
      createdAt: STAMP.format(r.createdAt),
    })),
    total,
    page,
    perPage: PER_PAGE,
  };
}

/** Distinct actions and entity types, for the filter selects. */
export async function activityFacets() {
  const [actions, entityTypes, actors] = await Promise.all([
    prisma.activityLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
    prisma.activityLog.findMany({
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
    }),
    prisma.user.findMany({
      where: { activity: { some: {} } },
      select: { id: true, email: true },
      orderBy: { email: "asc" },
      take: 200,
    }),
  ]);

  return {
    // `scholarship.create` is offered as `scholarship`, so one select covers
    // every action within a content type.
    actions: [...new Set(actions.map((a) => a.action.split(".")[0]))].sort(),
    entityTypes: entityTypes.map((e) => e.entityType).sort(),
    actors,
  };
}
