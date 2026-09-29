"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { atLeast, getCurrentUser, isStaff } from "@/lib/auth";
import { recordActivity } from "@/lib/audit";
import { getEntity, type EntityDef, type EntityModel } from "@/lib/admin-registry";
import { buildEntitySchema, entityFieldErrors } from "@/lib/validations/admin-entity";
import { changeSlugWithRedirect, generateUniqueSlug, slugify } from "@/lib/slug";

/**
 * Generic content mutations for the admin sections that share the registry.
 *
 * Authorization is re-checked on the server for every call: the UI hides actions
 * a role may not perform, but that is presentation only. These guards are the
 * actual boundary.
 */

export interface EntityActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Fields the form never sends but the table or editor needs. */
function editableFields(entity: EntityDef): string[] {
  return entity.fields.map((f) => f.name);
}

/** Wraps a model in the same action surface regardless of which one it is. */
function delegate(model: EntityModel) {
  switch (model) {
    case "university":
      return prisma.university;
    case "country":
      return prisma.country;
    case "field":
      return prisma.field;
    case "blogPost":
      return prisma.blogPost;
    case "resource":
      return prisma.resource;
    case "media":
      return prisma.media;
    case "user":
      return prisma.user;
  }
}

/**
 * Turns a Prisma unique-constraint failure into a message an admin can act on.
 *
 * Without this a duplicate slug or ISO code surfaces as a 500 error page, which
 * tells the admin nothing about which field collided or what to change.
 */
function uniqueConflict(error: unknown, entity: EntityDef): EntityActionState | null {
  if (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  ) {
    const target = (error as { meta?: { target?: string[] } }).meta?.target ?? [];
    const fields = target
      .filter((t) => t !== "id")
      .map((t) => entity.fields.find((f) => f.name === t)?.label ?? t)
      .filter(Boolean);

    return {
      error:
        fields.length > 0
          ? `Another ${entity.singular.toLowerCase()} already uses that ${fields.join(" or ").toLowerCase()}. Choose a different one.`
          : `That ${entity.singular.toLowerCase()} already exists.`,
    };
  }
  return null;
}

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    throw new AuthError("You must be signed in as an administrator to do that.");
  }
  return user;
}

class AuthError extends Error {}

async function requireAdmin() {
  const user = await requireEditor();
  if (!atLeast(user.role, "ADMIN")) {
    throw new AuthError("Your role does not have permission to do that.");
  }
  return user;
}

/**
 * Turns validated input into a Prisma payload.
 *
 * Only the registry's fields are copied, so a crafted request cannot set columns
 * the form does not expose (`id`, `createdAt`, relation ids it did not offer).
 */
function toData(entity: EntityDef, data: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const name of editableFields(entity)) {
    if (name in data) out[name] = data[name];
  }

  // Sitemap membership defaults to on; an unticked box submits an empty string.
  if (entity.hasPublish && !entity.fields.some((f) => f.name === "includeInSitemap")) {
    out.includeInSitemap = true;
  }

  // `size` is stored in bytes and must be an integer.
  if (entity.model === "media" && typeof out.size === "number") {
    out.size = Math.round(out.size);
  }

  return out;
}

/** Paths to refresh after a mutation: the admin list and the public section. */
function revalidateEntity(entity: EntityDef, slug?: string | null) {
  revalidatePath(`/admin/${entity.key}`);
  if (entity.hasTrash) revalidatePath("/admin/trash");

  const publicPath = PUBLIC_PATH[entity.key];
  if (publicPath) {
    revalidatePath(publicPath);
    for (const [model, paths] of Object.entries(PUBLIC_PATHS_FOR_MODEL)) {
      if (model === entity.model) for (const p of paths) revalidatePath(p);
    }
  }
  if (slug) revalidatePath(`${publicPath ?? "/scholarships"}/${slug}`);
}

const PUBLIC_PATH: Record<string, string> = {
  universities: "/universities",
  countries: "/countries",
  fields: "/fields",
  blog: "/blog",
  resources: "/resources",
  media: "/",
  users: "/",
};

/** Other public listings that embed the same records. */
const PUBLIC_PATHS_FOR_MODEL: Record<string, string[]> = {
  university: ["/scholarships", "/finder", "/", "/countries"],
  country: ["/scholarships", "/finder", "/", "/fields", "/universities"],
  field: ["/scholarships", "/finder", "/", "/fields"],
  blogPost: ["/blog", "/"],
  resource: ["/resources", "/"],
  media: [],
  user: [],
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createEntityRecord(
  entityKey: string,
  _prev: EntityActionState,
  formData: FormData
): Promise<EntityActionState> {
  const entity = getEntity(entityKey);
  if (!entity) return { error: "Unknown content type." };

  let actor: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  try {
    actor = await requireEditor();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  const schema = buildEntitySchema(entity);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    console.error(`[${entityKey}.create] validation failed`, parsed.error.issues);
    return { fieldErrors: entityFieldErrors(parsed.error) };
  }

  const input = parsed.data as Record<string, unknown>;
  const data = toData(entity, input);

  // Slug handling: generate from the title when absent, and keep it unique.
  if (entity.hasSlug) {
    const desired = String(data.slug ?? "").trim() ? slugify(String(data.slug)) : slugify(String(data.name ?? data.title ?? ""));
    data.slug = await generateUniqueSlug(entitySlugModel(entity.model), desired);
  }

  if (entity.hasPublish && !("publishStatus" in data)) {
    data.publishStatus = "DRAFT";
  }
  if (entity.hasFeatured && !("featured" in data)) {
    data.featured = false;
  }

  // Blog posts record when they first went live.
  if (entity.model === "blogPost" && data.publishStatus === "PUBLISHED") {
    data.publishedAt = data.publishedAt ?? new Date();
  }

  // Users cannot be created from the admin panel: an account has to come from a
  // signup, otherwise there is no password to sign in with.
  if (entity.model === "user") {
    return { error: "User accounts are created through sign-up, not here." };
  }

  let created: { id: string };
  try {
    created = (await (delegate(entity.model) as unknown as {
      create: (a: unknown) => Promise<{ id: string }>;
    }).create({ data })) as { id: string };
  } catch (error) {
    const conflict = uniqueConflict(error, entity);
    if (conflict) return conflict;
    throw error;
  }

  await recordActivity({
    action: `${entityKey}.create`,
    entityType: auditEntity(entity.model),
    entityId: created.id,
    summary: `Created ${entity.singular.toLowerCase()} "${String(data.name ?? data.title ?? data.originalName ?? created.id)}"`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidateEntity(entity, typeof data.slug === "string" ? data.slug : null);
  redirect(`/admin/${entity.key}/${created.id}/edit?saved=1`);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateEntityRecord(
  entityKey: string,
  id: string,
  _prev: EntityActionState,
  formData: FormData
): Promise<EntityActionState> {
  const entity = getEntity(entityKey);
  if (!entity) return { error: "Unknown content type." };

  let actor: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  try {
    actor = await requireEditor();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  const schema = buildEntitySchema(entity);
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    console.error(`[${entityKey}.update] validation failed`, parsed.error.issues);
    return { fieldErrors: entityFieldErrors(parsed.error) };
  }

  const input = parsed.data as Record<string, unknown>;
  const data = toData(entity, input);

  const d = delegate(entity.model) as unknown as {
    findUnique: (a: unknown) => Promise<{ slug: string | null } | null>;
    update: (a: unknown) => Promise<unknown>;
  };

  const existing = await d.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) return { error: `That ${entity.singular.toLowerCase()} no longer exists.` };

  if (entity.hasSlug) {
    const desired = String(data.slug ?? "").trim() ? slugify(String(data.slug)) : slugify(String(data.name ?? data.title ?? ""));
    data.slug = await generateUniqueSlug(entitySlugModel(entity.model), desired, id);
  }

  // Only a super admin may create or change another super admin, so a lesser
  // admin cannot escalate by editing a row.
  // A lesser admin must not be able to escalate a row to super admin, and must
  // not be able to edit a super admin row at all.
  if (entity.model === "user" && actor.role !== "SUPER_ADMIN") {
    const current = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (current?.role === "SUPER_ADMIN" || data.role === "SUPER_ADMIN") {
      return { error: "Only a super admin can manage super admin accounts." };
    }
  }
  if (entity.model === "user" && data.suspended === true) {
    data.suspendedAt = new Date();
  } else if (entity.model === "user") {
    data.suspendedAt = null;
  }

  if (entity.model === "blogPost" && data.publishStatus === "PUBLISHED" && !existing.slug) {
    data.publishedAt = data.publishedAt ?? new Date();
  }

  try {
    await d.update({ where: { id }, data });
  } catch (error) {
    const conflict = uniqueConflict(error, entity);
    if (conflict) return conflict;
    throw error;
  }

  const oldSlug = existing.slug ?? null;
  const newSlug = typeof data.slug === "string" ? data.slug : null;
  if (entity.hasSlug && oldSlug && newSlug && oldSlug !== newSlug) {
    await changeSlugWithRedirect(entitySlugModel(entity.model), oldSlug, newSlug);
  }

  await recordActivity({
    action: `${entityKey}.update`,
    entityType: auditEntity(entity.model),
    entityId: id,
    summary: `Updated ${entity.singular.toLowerCase()} "${String(data.name ?? data.title ?? data.originalName ?? data.email ?? id)}"`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidateEntity(entity, typeof data.slug === "string" ? data.slug : null);
  // Mirror the scholarship editor: navigate on success so the page re-reads the
  // saved record rather than echoing the submitted values back.
  redirect(`/admin/${entity.key}/${id}/edit?saved=1`);
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export async function setEntityPublishStatus(
  entityKey: string,
  id: string,
  publishStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"
): Promise<{ error?: string }> {
  const entity = getEntity(entityKey);
  if (!entity || !entity.hasPublish) return { error: "This content type is not published." };

  let actor: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  try {
    actor = await requireEditor();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  const d = delegate(entity.model) as unknown as {
    findUnique: (a: unknown) => Promise<{ slug?: string; title?: string; name?: string } | null>;
    update: (a: unknown) => Promise<unknown>;
  };
  const existing = await d.findUnique({ where: { id }, select: { slug: true, title: true, name: true } });
  if (!existing) return { error: `That ${entity.singular.toLowerCase()} no longer exists.` };

  await d.update({
    where: { id },
    data: {
      publishStatus,
      ...(entity.model === "blogPost" && publishStatus === "PUBLISHED" ? { publishedAt: new Date() } : {}),
    },
  });

  await recordActivity({
    action: `${entityKey}.${publishStatus.toLowerCase()}`,
    entityType: auditEntity(entity.model),
    entityId: id,
    summary: `${publishStatus === "PUBLISHED" ? "Published" : publishStatus === "DRAFT" ? "Unpublished" : "Archived"} "${existing.title ?? existing.name ?? id}"`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidateEntity(entity, existing.slug ?? null);
  return {};
}

export async function setEntityFeatured(
  entityKey: string,
  id: string,
  featured: boolean
): Promise<{ error?: string }> {
  const entity = getEntity(entityKey);
  if (!entity || !entity.hasFeatured) return { error: "This content type cannot be featured." };

  let actor: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  try {
    actor = await requireEditor();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  const d = delegate(entity.model) as unknown as {
    findUnique: (a: unknown) => Promise<{ slug?: string; title?: string; name?: string } | null>;
    update: (a: unknown) => Promise<unknown>;
  };
  const existing = await d.findUnique({ where: { id }, select: { slug: true, title: true, name: true } });
  if (!existing) return { error: `That ${entity.singular.toLowerCase()} no longer exists.` };

  await d.update({ where: { id }, data: { featured } });

  await recordActivity({
    action: `${entityKey}.${featured ? "feature" : "unfeature"}`,
    entityType: auditEntity(entity.model),
    entityId: id,
    summary: `${featured ? "Featured" : "Unfeatured"} "${existing.title ?? existing.name ?? id}"`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidateEntity(entity, existing.slug ?? null);
  return {};
}

export async function setUserSuspended(
  id: string,
  suspended: boolean
): Promise<{ error?: string }> {
  let actor: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  try {
    actor = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, suspended: true },
  });
  if (!target) return { error: "That user no longer exists." };

  // Locking yourself out, or demoting the last super admin, would leave the site
  // with nobody able to administer it.
  if (target.id === actor.id && suspended) {
    return { error: "You cannot suspend your own account." };
  }
  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    return { error: "Only a super admin can suspend a super admin." };
  }
  if (suspended) {
    const superAdmins = await prisma.user.count({
      where: { role: "SUPER_ADMIN", suspended: false, id: { not: target.id } },
    });
    if (target.role === "SUPER_ADMIN" && superAdmins === 0) {
      return { error: "At least one active super admin must remain." };
    }
  }

  await prisma.user.update({
    where: { id },
    data: {
      suspended,
      suspendedAt: suspended ? new Date() : null,
      suspendedReason: suspended ? null : undefined,
    },
  });

  // A suspended account must lose its sessions immediately, not at expiry.
  if (suspended) {
    await prisma.session.deleteMany({ where: { userId: id } });
  }

  await recordActivity({
    action: suspended ? "user.suspend" : "user.reactivate",
    entityType: "User",
    entityId: id,
    summary: `${suspended ? "Suspended" : "Reactivated"} ${target.email}`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/users");
  return {};
}

// ---------------------------------------------------------------------------
// Bulk and trash
// ---------------------------------------------------------------------------

export type BulkEntityAction =
  | "publish"
  | "unpublish"
  | "archive"
  | "trash"
  | "restore"
  | "feature"
  | "unfeature";

const BULK_LABEL: Record<BulkEntityAction, string> = {
  publish: "Published",
  unpublish: "Moved to draft",
  archive: "Archived",
  trash: "Moved to trash",
  restore: "Restored from trash",
  feature: "Marked as featured",
  unfeature: "Removed from featured",
};

export async function bulkEntityAction(
  entityKey: string,
  ids: string[],
  action: BulkEntityAction
): Promise<{ error?: string; affected?: number }> {
  const entity = getEntity(entityKey);
  if (!entity) return { error: "Unknown content type." };

  let actor: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  try {
    // Trashing is an administrative act, not an editorial one.
    if (action === "trash" || action === "restore") actor = await requireAdmin();
    else actor = await requireEditor();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return { error: "Select at least one record." };

  if ((action === "publish" || action === "unpublish" || action === "archive") && !entity.hasPublish) {
    return { error: "This content type is not published." };
  }
  if ((action === "feature" || action === "unfeature") && !entity.hasFeatured) {
    return { error: "This content type cannot be featured." };
  }
  if ((action === "trash" || action === "restore") && !entity.hasTrash) {
    return { error: "This content type cannot be deleted." };
  }

  const data: Record<string, unknown> =
    action === "publish"
      ? { publishStatus: "PUBLISHED" }
      : action === "unpublish"
        ? { publishStatus: "DRAFT" }
        : action === "archive"
          ? { publishStatus: "ARCHIVED" }
          : action === "trash"
            ? { deletedAt: new Date() }
            : action === "restore"
              ? { deletedAt: null }
              : action === "feature"
                ? { featured: true }
                : { featured: false };

  const d = delegate(entity.model) as unknown as {
    updateMany: (a: unknown) => Promise<{ count: number }>;
  };
  const result = await d.updateMany({ where: { id: { in: unique } }, data });

  await recordActivity({
    action: `${entityKey}.bulk_${action}`,
    entityType: auditEntity(entity.model),
    entityId: null,
    summary: `${BULK_LABEL[action]} ${result.count} ${entity.label.toLowerCase()}`,
    metadata: { count: result.count, ids: unique.slice(0, 50) },
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath(`/admin/${entity.key}`);
  if (entity.hasTrash) revalidatePath("/admin/trash");
  revalidatePath("/admin/dashboard");
  revalidateEntity(entity, null);

  return { affected: result.count };
}

export async function deleteEntityForever(
  entityKey: string,
  id: string,
  confirmed: boolean
): Promise<{ error?: string }> {
  const entity = getEntity(entityKey);
  if (!entity) return { error: "Unknown content type." };

  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return { error: "You must be signed in as an administrator." };
  if (user.role !== "SUPER_ADMIN") {
    return { error: "Only a super admin can permanently delete content." };
  }
  if (!confirmed) return { error: "Permanent deletion must be confirmed." };

  const d = delegate(entity.model) as unknown as {
    findUnique: (a: unknown) => Promise<{ slug?: string; title?: string; name?: string } | null>;
    delete: (a: unknown) => Promise<unknown>;
  };
  const existing = await d.findUnique({ where: { id }, select: { slug: true, title: true, name: true } });
  if (!existing) return { error: `That ${entity.singular.toLowerCase()} no longer exists.` };

  await d.delete({ where: { id } });

  await recordActivity({
    action: `${entityKey}.destroy`,
    entityType: auditEntity(entity.model),
    entityId: id,
    summary: `Permanently deleted "${existing.title ?? existing.name ?? id}"`,
    actor: { id: user.id, email: user.email },
  });

  revalidateEntity(entity, existing.slug ?? null);
  return {};
}

// --- helpers ---------------------------------------------------------------

function entitySlugModel(model: EntityModel) {
  switch (model) {
    case "university":
      return "university" as const;
    case "country":
      return "country" as const;
    case "field":
      return "field" as const;
    case "blogPost":
      return "blogPost" as const;
    case "resource":
      return "resource" as const;
    default:
      return "resource" as const;
  }
}

function auditEntity(model: EntityModel) {
  switch (model) {
    case "university":
      return "University" as const;
    case "country":
      return "Country" as const;
    case "field":
      return "Field" as const;
    case "blogPost":
      return "BlogPost" as const;
    case "resource":
      return "Resource" as const;
    case "media":
      return "Media" as const;
    case "user":
      return "User" as const;
  }
}
