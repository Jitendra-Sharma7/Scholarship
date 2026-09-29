import { NextResponse } from "next/server";

import { getCurrentUser, isStaff } from "@/lib/auth";
import { getAdminNotifications, getDerivedAlerts } from "@/lib/admin-notifications";
import { getSettingNumber } from "@/lib/settings";

/** Staff-only: returns operational alerts plus stored notifications. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const closingSoonDays = await getSettingNumber("scholarships.closingSoonDays", 14);

  const [stored, derived] = await Promise.all([
    getAdminNotifications(),
    getDerivedAlerts(closingSoonDays),
  ]);

  // Derived alerts come first: they reflect live data and need attention now.
  const items = [...derived, ...stored.items].slice(0, 20);

  return NextResponse.json(
    { items, unread: derived.length + stored.unread },
    { headers: { "Cache-Control": "no-store" } }
  );
}
