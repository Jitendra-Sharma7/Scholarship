"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { atLeast, getCurrentUser, isStaff } from "@/lib/auth";
import { recordActivity } from "@/lib/audit";
import { slugify } from "@/lib/slug";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    throw new Error("You must be signed in as an administrator.");
  }
  if (!atLeast(user.role, "ADMIN")) {
    throw new Error("Your role does not have permission to do that.");
  }
  return user;
}

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    throw new Error("You must be signed in as an administrator.");
  }
  if (!atLeast(user.role, "EDITOR")) {
    throw new Error("Your role does not have permission to do that.");
  }
  return user;
}

export async function createIntakeAction(formData: FormData) {
  let actor;
  try {
    actor = await requireEditor();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Authorization failed" };
  }

  const name = formData.get("name") as string;
  const startMonth = parseInt(formData.get("startMonth") as string, 10);
  const startYear = parseInt(formData.get("startYear") as string, 10);
  const endMonth = formData.get("endMonth") ? parseInt(formData.get("endMonth") as string, 10) : undefined;
  const endYear = formData.get("endYear") ? parseInt(formData.get("endYear") as string, 10) : undefined;
  const description = formData.get("description") as string | undefined;
  const isActive = formData.get("isActive") === "on";

  if (!name || !startMonth || !startYear) {
    return { error: "Name, start month, and start year are required" };
  }

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.intake.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const maxSortOrder = await prisma.intake.aggregate({ _max: { sortOrder: true } });

  const intake = await prisma.intake.create({
    data: {
      name,
      slug,
      startMonth,
      startYear,
      endMonth,
      endYear,
      description,
      isActive,
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
    },
  });

  await recordActivity({
    action: "intake.create",
    entityType: "Intake",
    entityId: intake.id,
    summary: `Created intake "${intake.name}"`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/intakes");
  redirect(`/admin/intakes/${intake.id}/edit?saved=1`);
}

export async function updateIntakeAction(id: string, formData: FormData) {
  let actor;
  try {
    actor = await requireEditor();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Authorization failed" };
  }

  const existing = await prisma.intake.findUnique({ where: { id } });
  if (!existing) return { error: "Intake not found" };

  const name = formData.get("name") as string;
  const startMonth = parseInt(formData.get("startMonth") as string, 10);
  const startYear = parseInt(formData.get("startYear") as string, 10);
  const endMonth = formData.get("endMonth") ? parseInt(formData.get("endMonth") as string, 10) : null;
  const endYear = formData.get("endYear") ? parseInt(formData.get("endYear") as string, 10) : null;
  const description = formData.get("description") as string | undefined;
  const isActive = formData.get("isActive") === "on";
  const sortOrder = formData.get("sortOrder") ? parseInt(formData.get("sortOrder") as string, 10) : undefined;

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const other = await prisma.intake.findUnique({ where: { slug } });
    if (!other || other.id === id) break;
    slug = `${baseSlug}-${counter++}`;
  }

  await prisma.intake.update({
    where: { id },
    data: {
      name,
      slug,
      startMonth,
      startYear,
      endMonth,
      endYear,
      description,
      isActive,
      sortOrder,
    },
  });

  await recordActivity({
    action: "intake.update",
    entityType: "Intake",
    entityId: id,
    summary: `Updated intake "${name}"`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/intakes");
  redirect(`/admin/intakes/${id}/edit?saved=1`);
}

export async function deleteIntake(id: string): Promise<{ error?: string }> {
  const actor = await requireAdmin();

  const existing = await prisma.intake.findUnique({ where: { id }, select: { name: true } });
  if (!existing) return { error: "Intake not found" };

  await prisma.intake.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });

  await recordActivity({
    action: "intake.delete",
    entityType: "Intake",
    entityId: id,
    summary: `Deleted intake "${existing.name}"`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/intakes");
  return {};
}

export async function toggleIntake(id: string): Promise<{ error?: string }> {
  const actor = await requireEditor();

  const existing = await prisma.intake.findUnique({ where: { id } });
  if (!existing) return { error: "Intake not found" };

  await prisma.intake.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  await recordActivity({
    action: existing.isActive ? "intake.deactivate" : "intake.activate",
    entityType: "Intake",
    entityId: id,
    summary: `${existing.isActive ? "Deactivated" : "Activated"} intake "${existing.name}"`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/intakes");
  return {};
}

export async function seedDefaultIntakesAction() {
  let actor;
  try {
    actor = await requireAdmin();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Authorization failed" };
  }

  const defaultIntakes = [
    { name: "September 2027", startMonth: 9, startYear: 2027, sortOrder: 1 },
    { name: "January 2028", startMonth: 1, startYear: 2028, sortOrder: 2 },
    { name: "May 2028", startMonth: 5, startYear: 2028, sortOrder: 3 },
    { name: "September 2028", startMonth: 9, startYear: 2028, sortOrder: 4 },
    { name: "January 2029", startMonth: 1, startYear: 2029, sortOrder: 5 },
  ];

  let created = 0;
  for (const intake of defaultIntakes) {
    const slug = intake.name.toLowerCase().replace(/\s+/g, "-");
    const exists = await prisma.intake.findUnique({ where: { slug } });
    if (!exists) {
      await prisma.intake.create({ data: { ...intake, slug } });
      created++;
    }
  }

  await recordActivity({
    action: "intake.seed",
    entityType: "Intake",
    entityId: null,
    summary: `Seeded ${created} default intakes`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/intakes");
  return { success: `Seeded ${created} default intakes` };
}