import { prisma } from "@/lib/prisma";

/**
 * Cross-entity search for the admin top bar.
 *
 * Runs bounded, indexed queries in parallel and caps each result set, so
 * typing never triggers a full-table scan or a huge response.
 */

export interface AdminSearchHit {
  entity: "Scholarship" | "University" | "Country" | "Field" | "BlogPost" | "Resource" | "User";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const PER_ENTITY = 5;

/** Escapes user input for a Postgres full-text/ILIKE search safely. */
function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function globalAdminSearch(rawQuery: string): Promise<AdminSearchHit[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const like = `%${escapeLike(query)}%`;

  const [scholarships, universities, countries, fields, posts, resources, users] =
    await Promise.all([
      prisma.scholarship.findMany({
        where: {
          deletedAt: null,
          OR: [{ title: { contains: like, mode: "insensitive" } }, { slug: { contains: like, mode: "insensitive" } }],
        },
        select: { id: true, title: true, fundingType: true, publishStatus: true },
        orderBy: { updatedAt: "desc" },
        take: PER_ENTITY,
      }),
      prisma.university.findMany({
        where: {
          deletedAt: null,
          OR: [{ name: { contains: like, mode: "insensitive" } }, { city: { contains: like, mode: "insensitive" } }],
        },
        select: { id: true, name: true, city: true },
        orderBy: { name: "asc" },
        take: PER_ENTITY,
      }),
      prisma.country.findMany({
        where: {
          deletedAt: null,
          OR: [{ name: { contains: like, mode: "insensitive" } }, { region: { contains: like, mode: "insensitive" } }],
        },
        select: { id: true, name: true, code: true, region: true },
        orderBy: { name: "asc" },
        take: PER_ENTITY,
      }),
      prisma.field.findMany({
        where: {
          deletedAt: null,
          OR: [{ name: { contains: like, mode: "insensitive" } }, { category: { contains: like, mode: "insensitive" } }],
        },
        select: { id: true, name: true, category: true },
        orderBy: { name: "asc" },
        take: PER_ENTITY,
      }),
      prisma.blogPost.findMany({
        where: {
          deletedAt: null,
          OR: [{ title: { contains: like, mode: "insensitive" } }, { category: { contains: like, mode: "insensitive" } }],
        },
        select: { id: true, title: true, category: true, publishStatus: true },
        orderBy: { updatedAt: "desc" },
        take: PER_ENTITY,
      }),
      prisma.resource.findMany({
        where: {
          deletedAt: null,
          OR: [{ title: { contains: like, mode: "insensitive" } }, { category: { contains: like, mode: "insensitive" } }],
        },
        select: { id: true, title: true, type: true, publishStatus: true },
        orderBy: { updatedAt: "desc" },
        take: PER_ENTITY,
      }),
      prisma.user.findMany({
        where: {
          OR: [{ email: { contains: like, mode: "insensitive" } }, { name: { contains: like, mode: "insensitive" } }],
        },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { createdAt: "desc" },
        take: PER_ENTITY,
      }),
    ]);

  const hits: AdminSearchHit[] = [
    ...scholarships.map((s) => ({
      entity: "Scholarship" as const,
      id: s.id,
      title: s.title,
      subtitle: `${s.publishStatus.toLowerCase()} scholarship`,
      href: `/admin/scholarships/${s.id}/edit`,
    })),
    ...universities.map((u) => ({
      entity: "University" as const,
      id: u.id,
      title: u.name,
      subtitle: u.city ?? "University",
      href: `/admin/universities/${u.id}/edit`,
    })),
    ...countries.map((c) => ({
      entity: "Country" as const,
      id: c.id,
      title: c.name,
      subtitle: c.region,
      href: `/admin/countries/${c.id}/edit`,
    })),
    ...fields.map((f) => ({
      entity: "Field" as const,
      id: f.id,
      title: f.name,
      subtitle: f.category ?? "Field of study",
      href: `/admin/fields/${f.id}/edit`,
    })),
    ...posts.map((p) => ({
      entity: "BlogPost" as const,
      id: p.id,
      title: p.title,
      subtitle: `${p.publishStatus.toLowerCase()} post`,
      href: `/admin/blog/${p.id}/edit`,
    })),
    ...resources.map((r) => ({
      entity: "Resource" as const,
      id: r.id,
      title: r.title,
      subtitle: `${r.publishStatus.toLowerCase()} ${r.type.toLowerCase()}`,
      href: `/admin/resources/${r.id}/edit`,
    })),
    ...users.map((u) => ({
      entity: "User" as const,
      id: u.id,
      title: u.name || u.email,
      subtitle: u.role.replace("_", " ").toLowerCase(),
      href: `/admin/users/${u.id}`,
    })),
  ];

  return hits.slice(0, 25);
}
