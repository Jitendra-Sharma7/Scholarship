import { prisma } from "@/lib/prisma";
import { getSettingNumber } from "@/lib/settings";

/**
 * Aggregations for the admin dashboard.
 *
 * Everything is counted in the database rather than by loading rows, and the
 * deadline buckets are derived from `deadline` so they stay accurate as time
 * passes without a scheduled job.
 */

export interface DashboardStats {
  scholarships: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    fullyFunded: number;
    featured: number;
    open: number;
    closingSoon: number;
    expired: number;
    inTrash: number;
  };
  universities: { total: number; published: number; inTrash: number };
  countries: { total: number; published: number; inTrash: number };
  fields: { total: number; inTrash: number };
  blog: { total: number; published: number; draft: number; scheduled: number };
  resources: { total: number; published: number; draft: number };
  users: { total: number; newThisMonth: number; staff: number; suspended: number };
  submissions: { pending: number; total: number };
  media: { total: number; bytes: number };
}

export interface BreakdownItem {
  label: string;
  count: number;
  href?: string;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  entityType: string;
  summary: string;
  actorEmail: string | null;
  createdAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getDashboardStats(closingSoonDays = 14): Promise<DashboardStats> {
  const now = new Date();
  const closingCutoff = new Date(now.getTime() + closingSoonDays * DAY_MS);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const live = { deletedAt: null };

  const [
    sTotal,
    sPublished,
    sDraft,
    sArchived,
    sFullyFunded,
    sFeatured,
    sOpen,
    sClosing,
    sExpired,
    sTrash,
    uTotal,
    uPublished,
    uTrash,
    cTotal,
    cPublished,
    cTrash,
    fTotal,
    fTrash,
    bTotal,
    bPublished,
    bDraft,
    bScheduled,
    rTotal,
    rPublished,
    rDraft,
    userTotal,
    usersThisMonth,
    staffTotal,
    suspendedTotal,
    subPending,
    subTotal,
    mediaAgg,
  ] = await Promise.all([
    prisma.scholarship.count({ where: live }),
    prisma.scholarship.count({ where: { ...live, publishStatus: "PUBLISHED" } }),
    prisma.scholarship.count({ where: { ...live, publishStatus: "DRAFT" } }),
    prisma.scholarship.count({ where: { ...live, publishStatus: "ARCHIVED" } }),
    prisma.scholarship.count({ where: { ...live, isFullyFunded: true } }),
    prisma.scholarship.count({ where: { ...live, featured: true } }),
    prisma.scholarship.count({
      where: { ...live, publishStatus: "PUBLISHED", deadline: { gte: now } },
    }),
    prisma.scholarship.count({
      where: {
        ...live,
        publishStatus: "PUBLISHED",
        deadline: { gte: now, lte: closingCutoff },
      },
    }),
    prisma.scholarship.count({ where: { ...live, deadline: { lt: now } } }),
    prisma.scholarship.count({ where: { deletedAt: { not: null } } }),

    prisma.university.count({ where: live }),
    prisma.university.count({ where: { ...live, publishStatus: "PUBLISHED" } }),
    prisma.university.count({ where: { deletedAt: { not: null } } }),

    prisma.country.count({ where: live }),
    prisma.country.count({ where: { ...live, publishStatus: "PUBLISHED" } }),
    prisma.country.count({ where: { deletedAt: { not: null } } }),

    prisma.field.count({ where: live }),
    prisma.field.count({ where: { deletedAt: { not: null } } }),

    prisma.blogPost.count({ where: live }),
    prisma.blogPost.count({ where: { ...live, publishStatus: "PUBLISHED" } }),
    prisma.blogPost.count({ where: { ...live, publishStatus: "DRAFT" } }),
    prisma.blogPost.count({ where: { ...live, scheduledAt: { gt: now } } }),

    prisma.resource.count({ where: live }),
    prisma.resource.count({ where: { ...live, publishStatus: "PUBLISHED" } }),
    prisma.resource.count({ where: { ...live, publishStatus: "DRAFT" } }),

    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { role: { in: ["EDITOR", "ADMIN", "SUPER_ADMIN"] } } }),
    prisma.user.count({ where: { suspended: true } }),

    prisma.submission.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] }, deletedAt: null } }),
    prisma.submission.count({ where: { deletedAt: null } }),

    prisma.media.aggregate({ where: { deletedAt: null }, _count: true, _sum: { size: true } }),
  ]);

  return {
    scholarships: {
      total: sTotal,
      published: sPublished,
      draft: sDraft,
      archived: sArchived,
      fullyFunded: sFullyFunded,
      featured: sFeatured,
      open: sOpen,
      closingSoon: sClosing,
      expired: sExpired,
      inTrash: sTrash,
    },
    universities: { total: uTotal, published: uPublished, inTrash: uTrash },
    countries: { total: cTotal, published: cPublished, inTrash: cTrash },
    fields: { total: fTotal, inTrash: fTrash },
    blog: { total: bTotal, published: bPublished, draft: bDraft, scheduled: bScheduled },
    resources: { total: rTotal, published: rPublished, draft: rDraft },
    users: {
      total: userTotal,
      newThisMonth: usersThisMonth,
      staff: staffTotal,
      suspended: suspendedTotal,
    },
    submissions: { pending: subPending, total: subTotal },
    media: { total: mediaAgg._count, bytes: mediaAgg._sum.size ?? 0 },
  };
}

export async function getScholarshipBreakdowns(take = 6): Promise<{
  byCountry: BreakdownItem[];
  byField: BreakdownItem[];
  byDegree: BreakdownItem[];
  byFunding: BreakdownItem[];
  byVerification: BreakdownItem[];
}> {
  const live = { deletedAt: null, publishStatus: "PUBLISHED" as const };

  // Degree levels are a scalar array, so they are counted from a narrow
  // projection below rather than grouped: Postgres cannot group an array column.
  const [byCountry, byField, byFunding, byVerification] = await Promise.all([
    prisma.scholarship.groupBy({
      by: ["countryId"],
      where: live,
      _count: { _all: true },
      orderBy: { _count: { countryId: "desc" } },
      take,
    }),
    prisma.scholarshipField.groupBy({
      by: ["fieldId"],
      where: { scholarship: live },
      _count: { _all: true },
      orderBy: { _count: { fieldId: "desc" } },
      take,
    }),
    prisma.scholarship.groupBy({
      by: ["fundingType"],
      where: live,
      _count: { _all: true },
      orderBy: { _count: { fundingType: "desc" } },
    }),
    prisma.scholarship.groupBy({
      by: ["verificationStatus"],
      where: live,
      _count: { _all: true },
      orderBy: { _count: { verificationStatus: "desc" } },
    }),
  ]);

  // Resolve the foreign keys to human labels in one extra round trip.
  const countryIds = byCountry.map((c) => c.countryId).filter((v): v is string => Boolean(v));
  const fieldIds = byField.map((f) => f.fieldId);

  const [countries, fields] = await Promise.all([
    prisma.country.findMany({
      where: { id: { in: countryIds } },
      select: { id: true, name: true },
    }),
    prisma.field.findMany({ where: { id: { in: fieldIds } }, select: { id: true, name: true } }),
  ]);

  const countryName = new Map(countries.map((c) => [c.id, c.name]));
  const fieldName = new Map(fields.map((f) => [f.id, f.name]));

  // Degree levels are a scalar array, so count them in memory from a narrow
  // projection rather than grouping (Postgres cannot group an array column).
  const degreeRows = await prisma.scholarship.findMany({
    where: live,
    select: { degreeLevels: true },
  });
  const degreeCounts = new Map<string, number>();
  for (const row of degreeRows) {
    for (const level of row.degreeLevels) {
      degreeCounts.set(level, (degreeCounts.get(level) ?? 0) + 1);
    }
  }

  return {
    byCountry: byCountry.map((row) => ({
      label: row.countryId ? (countryName.get(row.countryId) ?? "Unassigned") : "Unassigned",
      count: row._count._all,
      href: row.countryId ? `/admin/scholarships?country=${row.countryId}` : undefined,
    })),
    byField: byField.map((row) => ({
      label: fieldName.get(row.fieldId) ?? "Unknown",
      count: row._count._all,
      href: `/admin/scholarships?field=${row.fieldId}`,
    })),
    byDegree: [...degreeCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, take),
    byFunding: byFunding.map((row) => ({
      label: row.fundingType.toLowerCase().replace(/-/g, " "),
      count: row._count._all,
      href: `/admin/scholarships?funding=${row.fundingType}`,
    })),
    byVerification: byVerification.map((row) => ({
      label: row.verificationStatus,
      count: row._count._all,
    })),
  };
}

export interface RecentContentItem {
  id: string;
  title: string;
  href: string;
  meta: string;
  updatedAt: string;
}

export async function getRecentContent(): Promise<{
  scholarshipsAdded: RecentContentItem[];
  scholarshipsUpdated: RecentContentItem[];
  universities: RecentContentItem[];
  blogPosts: RecentContentItem[];
  users: RecentContentItem[];
}> {
  const [added, updated, universities, posts, users] = await Promise.all([
    prisma.scholarship.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true, publishStatus: true },
    }),
    prisma.scholarship.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, updatedAt: true, publishStatus: true },
    }),
    prisma.university.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, city: true, createdAt: true },
    }),
    prisma.blogPost.findMany({
      where: { deletedAt: null },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: { id: true, title: true, publishedAt: true, publishStatus: true, authorName: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true, role: true },
    }),
  ]);

  return {
    scholarshipsAdded: added.map((s) => ({
      id: s.id,
      title: s.title,
      href: `/admin/scholarships/${s.id}/edit`,
      meta: s.publishStatus.toLowerCase(),
      updatedAt: s.createdAt.toISOString(),
    })),
    scholarshipsUpdated: updated.map((s) => ({
      id: s.id,
      title: s.title,
      href: `/admin/scholarships/${s.id}/edit`,
      meta: s.publishStatus.toLowerCase(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    universities: universities.map((u) => ({
      id: u.id,
      title: u.name,
      href: `/admin/universities/${u.id}/edit`,
      meta: u.city ?? "University",
      updatedAt: u.createdAt.toISOString(),
    })),
    blogPosts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      href: `/admin/blog/${p.id}/edit`,
      meta: `${p.publishStatus.toLowerCase()}${p.authorName ? ` · ${p.authorName}` : ""}`,
      updatedAt: (p.publishedAt ?? new Date()).toISOString(),
    })),
    users: users.map((u) => ({
      id: u.id,
      title: u.name || u.email,
      // There is no separate user detail page; the record is edited from the
      // users list, so link there rather than to a URL that would 404.
      href: `/admin/users?q=${encodeURIComponent(u.email)}`,
      meta: u.role.toLowerCase().replace("_", " "),
      updatedAt: u.createdAt.toISOString(),
    })),
  };
}

export async function getRecentActivity(take = 12): Promise<RecentActivityItem[]> {
  const rows = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      action: true,
      entityType: true,
      summary: true,
      actorEmail: true,
      createdAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entityType: r.entityType,
    summary: r.summary,
    actorEmail: r.actorEmail,
    createdAt: r.createdAt.toISOString(),
  }));
}

export { getSettingNumber };
