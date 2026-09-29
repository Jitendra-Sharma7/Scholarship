import { NextResponse } from "next/server";

import { getCurrentUser, isStaff } from "@/lib/auth";
import { globalAdminSearch } from "@/lib/admin-search";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Cross-entity admin search.
 *
 * Staff-only and rate limited: it fans out to seven tables, so it must not be
 * reachable anonymously or be used to hammer the database.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit("admin-search", 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";
  const hits = await globalAdminSearch(query);

  return NextResponse.json(
    { query, hits, total: hits.length },
    { headers: { "Cache-Control": "no-store" } }
  );
}
