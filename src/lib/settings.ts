import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Typed access to the key/value settings table.
 *
 * Values are stored as JSON so booleans, numbers and strings all round-trip
 * correctly. Reads are cached per process for a short window because settings
 * are read on nearly every public page render but change rarely.
 */

const CACHE_TTL_MS = 30_000;

let cache: { at: number; data: Map<string, unknown> } | null = null;

export async function getAllSettings(): Promise<Map<string, unknown>> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.data;

  const rows = await prisma.setting.findMany();
  const data = new Map<string, unknown>(rows.map((r) => [r.key, r.value]));
  cache = { at: now, data };
  return data;
}

export function invalidateSettingsCache(): void {
  cache = null;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const all = await getAllSettings();
  return (all.get(key) as T) ?? fallback;
}

export async function getSettingNumber(key: string, fallback: number): Promise<number> {
  const value = await getSetting<unknown>(key, fallback);
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function getSettingString(key: string, fallback: string): Promise<string> {
  const value = await getSetting<unknown>(key, fallback);
  return typeof value === "string" ? value : fallback;
}

export async function getSettingBoolean(key: string, fallback: boolean): Promise<boolean> {
  const value = await getSetting<unknown>(key, fallback);
  return typeof value === "boolean" ? value : fallback;
}

/** Writes many settings at once. Unknown keys are created. */
export async function setSettings(entries: Record<string, Prisma.InputJsonValue>): Promise<void> {
  await prisma.$transaction(
    Object.entries(entries).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );
  invalidateSettingsCache();
}
