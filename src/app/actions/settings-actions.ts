"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser, isStaff } from "@/lib/auth";
import { recordActivity } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { setSettings } from "@/lib/settings";
import {
  SETTING_DEFS,
  SETTING_KEYS,
  type SettingsActionState,
} from "@/lib/settings/definitions";
import { schemaForSetting } from "@/lib/validations/admin-settings";

/**
 * Site settings writes.
 *
 * SUPER_ADMIN only, and only for keys the site knows about: an unrecognised key
 * would be stored but never read, which is the failure mode this file exists to
 * prevent.
 */

class AuthError extends Error {}

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role) || user.role !== "SUPER_ADMIN") {
    throw new AuthError("Only a super admin can change site settings.");
  }
  return user;
}

export async function saveSettings(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  let actor: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    actor = await requireSuperAdmin();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  const entries: Record<string, string | number | boolean> = {};
  const fieldErrors: Record<string, string> = {};

  for (const def of SETTING_DEFS) {
    // A boolean the form renders as a pair of hidden sentinels submits "" when
    // unticked; the checkbox submits "true" when ticked.
    if (def.kind === "boolean") {
      entries[def.key] = formData.get(def.key) === "true";
      continue;
    }

    const raw = formData.get(def.key);
    const parsed = schemaForSetting(def).safeParse(raw == null ? "" : raw);
    if (!parsed.success) {
      fieldErrors[def.key] = parsed.error.issues[0]?.message ?? "Invalid value";
      continue;
    }
    entries[def.key] = parsed.data as string | number;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // Refuse a key the site does not read, rather than storing dead configuration.
  for (const key of formData.keys()) {
    if (!SETTING_KEYS.has(key)) {
      console.warn(`[settings] ignored unknown key "${key}"`);
    }
  }

  await setSettings(entries as Record<string, never>);

  await recordActivity({
    action: "settings.update",
    entityType: "Setting",
    entityId: null,
    summary: `Updated site settings: ${Object.keys(entries).join(", ")}`,
    metadata: { keys: Object.keys(entries) },
    actor: { id: actor!.id, email: actor!.email },
  });

  revalidatePath("/admin/settings");
  // Settings are read during public renders, so every cached page that reads one
  // has to be rebuilt.
  revalidatePath("/", "layout");

  return { saved: true };
}

/** Removes a setting so the code default applies again. */
export async function resetSetting(key: string): Promise<{ error?: string }> {
  let actor: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    actor = await requireSuperAdmin();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  if (!SETTING_KEYS.has(key)) return { error: "That is not a site setting." };

  await prisma.setting.deleteMany({ where: { key } });

  await recordActivity({
    action: "settings.reset",
    entityType: "Setting",
    entityId: key,
    summary: `Reset "${key}" to its default`,
    actor: { id: actor!.id, email: actor!.email },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return {};
}
