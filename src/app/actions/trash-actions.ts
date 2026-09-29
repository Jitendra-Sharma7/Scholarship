"use server";

import { revalidatePath } from "next/cache";
import type { ActivityEntity } from "@/lib/audit";

import { prisma } from "@/lib/prisma";
import { atLeast, getCurrentUser, isStaff } from "@/lib/auth";
import { recordActivity } from "@/lib/audit";

/**
 * Soft-delete lifecycle for content that supports a trash.
 *
 * Only `SUPER_ADMIN` may remove something permanently, and permanent removal is
 * always a separate call from moving to the trash, so a mis-click cannot destroy
 * a record that a restore would have recovered.
 */

export type RestorableModel = "scholarship" | "resource";

const TITLES: Record<RestorableModel, ActivityEntity> = {
  scholarship: "Scholarship",
  resource: "Resource",
};

interface TrashTarget {
  title: string;
  slug: string | null;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role) || !atLeast(user.role, "ADMIN")) {
    throw new Error("Only an administrator can restore or delete content.");
  }
  return user;
}

/**
 * The two delegates have different generated types, so the branches are written
 * out rather than held in a union - a union of delegates is not callable.
 */
async function findTarget(model: RestorableModel, id: string): Promise<TrashTarget | null> {
  if (model === "scholarship") {
    return prisma.scholarship.findUnique({
      where: { id },
      select: { title: true, slug: true },
    });
  }
  return prisma.resource.findUnique({
    where: { id },
    select: { title: true, slug: true },
  });
}

async function clearDeletedAt(model: RestorableModel, id: string): Promise<void> {
  if (model === "scholarship") {
    await prisma.scholarship.update({ where: { id }, data: { deletedAt: null } });
    return;
  }
  await prisma.resource.update({ where: { id }, data: { deletedAt: null } });
}

async function hardDelete(model: RestorableModel, id: string): Promise<void> {
  if (model === "scholarship") {
    await prisma.scholarship.delete({ where: { id } });
    return;
  }
  await prisma.resource.delete({ where: { id } });
}

export async function restoreItem(
  model: RestorableModel,
  id: string
): Promise<{ error?: string }> {
  const user = await requireAdmin();

  const record = await findTarget(model, id);
  if (!record) return { error: `That ${model} no longer exists.` };

  await clearDeletedAt(model, id);

  await recordActivity({
    action: `${model}.restore`,
    entityType: TITLES[model],
    entityId: id,
    summary: `Restored "${record.title}" from trash`,
    actor: { id: user.id, email: user.email },
  });

  revalidatePath("/admin/trash");
  revalidatePath(`/admin/${model}s`);
  if (record.slug && model === "scholarship") {
    revalidatePath(`/scholarships/${record.slug}`);
  }

  return {};
}

export async function destroyItemForever(
  model: RestorableModel,
  id: string,
  confirmed: boolean
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return { error: "You must be signed in as an administrator." };
  }
  if (user.role !== "SUPER_ADMIN") {
    return { error: "Only a super admin can permanently delete content." };
  }
  if (!confirmed) {
    return { error: "Permanent deletion must be confirmed." };
  }

  const record = await findTarget(model, id);
  if (!record) return { error: `That ${model} no longer exists.` };

  await hardDelete(model, id);

  await recordActivity({
    action: `${model}.destroy`,
    entityType: TITLES[model],
    entityId: id,
    summary: `Permanently deleted "${record.title}"`,
    actor: { id: user.id, email: user.email },
  });

  revalidatePath("/admin/trash");
  revalidatePath(`/admin/${model}s`);
  if (record.slug && model === "scholarship") {
    revalidatePath(`/scholarships/${record.slug}`);
  }

  return {};
}
