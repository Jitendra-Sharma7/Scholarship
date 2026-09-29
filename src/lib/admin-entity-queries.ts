import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PER_PAGE } from "@/lib/admin-pagination";
import { ENTITIES, getEntity, humanizeEnum, type EntityDef, type EntityModel } from "@/lib/admin-registry";

/**
 * Generic list queries for the admin content sections.
 *
 * The registry describes each entity's columns and filters, so one implementation
 * serves every section. Filtering, sorting, and pagination run in the database:
 * the browser only ever receives the rows on the current page.
 */

export interface ListFilters {
  q?: string;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  trashed?: boolean;
  status?: string;
  featured?: string;
  role?: string;
  suspended?: string;
  countryId?: string;
  type?: string;
}

const DELEGATE = {
  university: () => prisma.university,
  country: () => prisma.country,
  field: () => prisma.field,
  blogPost: () => prisma.blogPost,
  resource: () => prisma.resource,
  media: () => prisma.media,
  user: () => prisma.user,
} as const;

export type Row = Record<string, unknown> & { id: string };

/**
 * Prisma selects per model, including the relation labels the table needs so no
 * N+1 query is issued while rendering.
 */
function selectFor(model: EntityModel): Prisma.UniversitySelect | Prisma.CountrySelect | Prisma.FieldSelect | Prisma.BlogPostSelect | Prisma.ResourceSelect | Prisma.MediaSelect | Prisma.UserSelect {
  switch (model) {
    case "university":
      return {
        id: true, name: true, slug: true, city: true, region: true, type: true,
        qsRanking: true, featured: true, publishStatus: true, updatedAt: true, deletedAt: true,
        country: { select: { name: true } },
        _count: { select: { scholarships: true } },
      } as Prisma.UniversitySelect;
    case "country":
      return {
        id: true, name: true, code: true, region: true, capital: true, currency: true,
        featured: true, publishStatus: true, updatedAt: true, deletedAt: true,
        _count: { select: { scholarships: true } },
      } as Prisma.CountrySelect;
    case "field":
      return {
        id: true, name: true, slug: true, category: true,
        publishStatus: true, updatedAt: true, deletedAt: true,
        parent: { select: { name: true } },
        _count: { select: { children: true, scholarships: true } },
      } as Prisma.FieldSelect;
    case "blogPost":
      return {
        id: true, title: true, slug: true, category: true, authorName: true,
        readingTime: true, publishedAt: true, featured: true, publishStatus: true,
        createdAt: true, updatedAt: true, deletedAt: true,
      } as Prisma.BlogPostSelect;
    case "resource":
      return {
        id: true, title: true, slug: true, type: true, category: true, featured: true,
        publishStatus: true, createdAt: true, updatedAt: true, deletedAt: true,
      } as Prisma.ResourceSelect;
    case "media":
      // Media has no `updatedAt`: a file's metadata is set on upload and the row
      // is replaced rather than edited.
      return {
        id: true, filename: true, originalName: true, mimeType: true, size: true,
        folder: true, url: true, alt: true, createdAt: true, deletedAt: true,
      } as Prisma.MediaSelect;
    case "user":
      return {
        id: true, name: true, email: true, role: true, suspended: true,
        suspendedReason: true, lastLoginAt: true, createdAt: true, updatedAt: true,
      } as Prisma.UserSelect;
  }
}

/** Column key -> the field to sort by, where they differ. */
const SORT_MAP: Record<string, string> = {
  name: "name",
  title: "title",
  updatedAt: "updatedAt",
  createdAt: "createdAt",
  publishedAt: "publishedAt",
  country: "countryId",
  type: "type",
};

function buildWhere(entity: EntityDef, filters: ListFilters, trashed: boolean) {
  const where: Record<string, unknown> = {};
  const model = entity.model;

  // Users have no soft delete; trashing is meaningless for them.
  if (entity.hasTrash) {
    where.deletedAt = trashed ? { not: null } : null;
  }

  const q = filters.q?.trim();
  if (q) {
    if (model === "user") {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    } else if (model === "media") {
      where.OR = [
        { originalName: { contains: q, mode: "insensitive" } },
        { filename: { contains: q, mode: "insensitive" } },
        { alt: { contains: q, mode: "insensitive" } },
        { folder: { contains: q, mode: "insensitive" } },
      ];
    } else if (model === "field" || model === "country" || model === "university") {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    } else {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }
  }

  if (model === "university" && filters.countryId) where.countryId = filters.countryId;
  if (entity.hasPublish && filters.status) where.publishStatus = filters.status;
  if (entity.hasFeatured && filters.featured) where.featured = filters.featured === "yes";
  if (model === "resource" && filters.type) where.type = filters.type;
  if (model === "user") {
    if (filters.role) where.role = filters.role;
    if (filters.suspended === "yes") where.suspended = true;
    if (filters.suspended === "no") where.suspended = false;
  }

  return where as Prisma.ScholarshipWhereInput;
}

/**
 * Formats a timestamp for a table cell on the server.
 *
 * Doing this server-side keeps one string identical in the server-rendered HTML
 * and after hydration. A client-side `toLocaleDateString` would render in the
 * server's timezone and the browser's, which is a hydration mismatch for anyone
 * not on UTC.
 */
const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function day(value: unknown): string {
  if (value == null) return "";
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? "" : DAY.format(d);
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Flattens a selected row into the shape the table's columns expect. */
function toRow(entity: EntityDef, raw: Record<string, unknown>): Row {
  const count = raw._count as { scholarships?: number; children?: number } | undefined;
  const trashed = raw.deletedAt != null;

  switch (entity.model) {
    case "university":
      return {
        id: raw.id as string,
        name: raw.name,
        slug: raw.slug,
        city: raw.city,
        region: raw.region,
        type: raw.type,
        qsRanking: toNumber(raw.qsRanking),
        country: (raw.country as { name: string } | null)?.name ?? "",
        scholarshipCount: count?.scholarships ?? 0,
        featured: raw.featured,
        publishStatus: raw.publishStatus,
        updatedAt: day(raw.updatedAt),
        deletedAt: trashed,
      };
    case "country":
      return {
        id: raw.id as string,
        name: raw.name,
        code: raw.code,
        region: raw.region,
        capital: raw.capital,
        currency: raw.currency,
        scholarshipCount: count?.scholarships ?? 0,
        featured: raw.featured,
        publishStatus: raw.publishStatus,
        updatedAt: day(raw.updatedAt),
        deletedAt: trashed,
      };
    case "field":
      return {
        id: raw.id as string,
        name: raw.name,
        slug: raw.slug,
        category: raw.category,
        parentName: (raw.parent as { name: string } | null)?.name ?? "",
        childCount: count?.children ?? 0,
        scholarshipCount: count?.scholarships ?? 0,
        publishStatus: raw.publishStatus,
        updatedAt: day(raw.updatedAt),
        deletedAt: trashed,
      };
    case "blogPost":
      return {
        id: raw.id as string,
        title: raw.title,
        slug: raw.slug,
        category: raw.category,
        authorName: raw.authorName,
        readingTime: toNumber(raw.readingTime),
        publishedAt: day(raw.publishedAt),
        featured: raw.featured,
        publishStatus: raw.publishStatus,
        updatedAt: day(raw.updatedAt),
        createdAt: day(raw.createdAt),
        deletedAt: trashed,
      };
    case "resource":
      return {
        id: raw.id as string,
        title: raw.title,
        slug: raw.slug,
        type: raw.type,
        category: raw.category,
        featured: raw.featured,
        publishStatus: raw.publishStatus,
        updatedAt: day(raw.updatedAt),
        createdAt: day(raw.createdAt),
        deletedAt: trashed,
      };
    case "media":
      return {
        id: raw.id as string,
        originalName: raw.originalName,
        filename: raw.filename,
        mimeType: raw.mimeType,
        size: toNumber(raw.size),
        folder: raw.folder,
        url: raw.url,
        alt: raw.alt,
        updatedAt: day(raw.createdAt),
        createdAt: day(raw.createdAt),
        deletedAt: trashed,
      };
    case "user":
      return {
        id: raw.id as string,
        name: raw.name ?? raw.email,
        email: raw.email,
        role: raw.role,
        suspended: raw.suspended,
        lastLoginAt: day(raw.lastLoginAt),
        createdAt: day(raw.createdAt),
        updatedAt: day(raw.updatedAt),
        deletedAt: false,
      };
  }
}

export async function listEntity(
  entity: EntityDef,
  filters: ListFilters
): Promise<{ rows: Row[]; total: number; page: number; perPage: number }> {
  const trashed = filters.trashed === true;
  const where = buildWhere(entity, filters, trashed);
  const page = Math.max(1, filters.page ?? 1);

  const dir = filters.dir === "asc" || filters.dir === "desc" ? filters.dir : entity.defaultSort.dir;
  const sortKeys = new Set(entity.columns.map((c) => c.key));
  const requested = filters.sort && sortKeys.has(filters.sort) ? filters.sort : entity.defaultSort.key;
  const sortField = SORT_MAP[requested] ?? requested;

  const delegate = DELEGATE[entity.model]() as unknown as {
    count: (a: unknown) => Promise<number>;
    findMany: (a: unknown) => Promise<Record<string, unknown>[]>;
  };

  const [total, raw] = await Promise.all([
    delegate.count({ where }),
    delegate.findMany({
      where,
      orderBy: { [sortField]: dir },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: selectFor(entity.model),
    }),
  ]);

  return {
    rows: raw.map((r) => toRow(entity, r)),
    total,
    page,
    perPage: PER_PAGE,
  };
}

/** Loads a single record with everything the editor needs, including relations. */
export async function getEntityRecord(
  entity: EntityDef,
  id: string
): Promise<(Record<string, unknown> & { id: string }) | null> {
  const delegate = DELEGATE[entity.model]() as unknown as {
    findUnique: (a: unknown) => Promise<{ id: string } & Record<string, unknown> | null>;
  };
  return delegate.findUnique({ where: { id } });
}

/** Options for the editor's reference selects and the list filter bar. */
export async function getEntityOptions(entityKey: string) {
  const needed = new Set<string>();
  const entity = ENTITIES[entityKey];
  if (entity) {
    for (const f of entity.fields) if (f.refOptions) needed.add(f.refOptions);
    for (const f of entity.filters) if (f.ref) needed.add(f.ref);
  }

  const [countries, fields, users] = await Promise.all([
    needed.has("countries")
      ? prisma.country.findMany({
          where: { deletedAt: null },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [],
    needed.has("fields") || needed.has("parents")
      ? prisma.field.findMany({
          where: { deletedAt: null },
          orderBy: { name: "asc" },
          select: { id: true, name: true, parentId: true },
        })
      : [],
    needed.has("users")
      ? prisma.user.findMany({
          orderBy: { email: "asc" },
          take: 500,
          select: { id: true, name: true, email: true },
        })
      : [],
  ]);

  const folders = entity?.model === "media"
    ? (
        await prisma.media.findMany({
          where: { deletedAt: null },
          distinct: ["folder"],
          select: { folder: true },
          orderBy: { folder: "asc" },
        })
      ).map((f) => f.folder)
    : [];

  return { countries, fields, users, folders };
}

/**
 * Select options for the editor, keyed by field name.
 *
 * Resolved once per request so the browser receives a plain array of choices
 * instead of needing its own database access.
 */
export async function getEntityFormOptions(
  entityKey: string
): Promise<Record<string, { value: string; label: string; disabled?: boolean }[]>> {
  const entity = getEntity(entityKey);
  if (!entity) return {};

  const { countries, fields, users } = await getEntityOptions(entityKey);
  const out: Record<string, { value: string; label: string; disabled?: boolean }[]> = {};

  for (const field of entity.fields) {
    if (field.kind !== "select") continue;

    if (field.refOptions === "countries") {
      out[field.name] = countries.map((c) => ({ value: c.id, label: c.name }));
    } else if (field.refOptions === "users") {
      out[field.name] = users.map((u) => ({ value: u.id, label: u.email }));
    } else if (field.refOptions === "parents" || field.refOptions === "fields") {
      // Indent by depth so a nested field reads as nested in the dropdown.
      const byId = new Map(fields.map((f) => [f.id, f]));
      const depth = (id: string): number => {
        let n = 0;
        let cursor = byId.get(id);
        while (cursor?.parentId && n < 4) {
          n += 1;
          cursor = byId.get(cursor.parentId);
        }
        return n;
      };
      out[field.name] = fields.map((f) => ({
        value: f.id,
        label: `${"\u2013 ".repeat(depth(f.id))}${f.name}`,
      }));
    } else if (field.options) {
      out[field.name] = field.options.map((o) => ({ value: o, label: humanizeEnum(o) }));
    }
  }

  return out;
}
