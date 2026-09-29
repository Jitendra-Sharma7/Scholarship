"use server";

/**
 * Staff-only reads for admin shell components.
 *
 * The notification bell and the global search box live in the browser but have
 * no data at request time, so they call these instead of a JSON route. Each
 * repeats the staff check the route made: a server action is only reachable
 * from this app, but it is still only reachable *by* a signed-in staff member.
 */
import { getCurrentUser, isStaff } from "@/lib/auth";
import { globalAdminSearch, type AdminSearchHit } from "@/lib/admin-search";
import { getAdminNotifications, getDerivedAlerts } from "@/lib/admin-notifications";
import { getSettingNumber } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";

export interface AdminNotificationPayload {
  items: Awaited<ReturnType<typeof getAdminNotifications>>["items"];
  unread: number;
}

/**
 * Search fans out to seven tables, so it stays rate limited: an action is not a
 * licence to hammer the database from a loop.
 */
export async function searchAdminContent(
  query: string
): Promise<{ hits: AdminSearchHit[] } | { error: string }> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return { error: "Unauthorized" };
  }

  const limit = await rateLimit("admin-search", 60);
  if (!limit.allowed) {
    return { error: "Too many requests" };
  }

  const term = (query ?? "").slice(0, 120);
  return { hits: await globalAdminSearch(term) };
}

export async function fetchAdminNotifications(): Promise<AdminNotificationPayload | { error: string }> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return { error: "Unauthorized" };
  }

  const closingSoonDays = await getSettingNumber("scholarships.closingSoonDays", 14);
  const [stored, derived] = await Promise.all([
    getAdminNotifications(),
    getDerivedAlerts(closingSoonDays),
  ]);

  // Derived alerts come first: they reflect live data and need attention now.
  const items = [...derived, ...stored.items].slice(0, 20);
  return { items, unread: derived.length + stored.unread };
}
