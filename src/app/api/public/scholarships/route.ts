import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getPublicScholarships } from "@/lib/data/public";
import { getSettingNumber } from "@/lib/settings";

/**
 * Read-only public API for the scholarship listing.
 *
 * The public listing is client-rendered for its filters and pagination, so it
 * needs a JSON endpoint. Only published, non-deleted rows are ever returned -
 * the same visibility rule the server-rendered pages use.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const closingSoonDays = await getSettingNumber("scholarships.closingSoonDays", 14);

  try {
    const result = await getPublicScholarships(
      {
        query: sp.get("query") || undefined,
        country: sp.get("country") || undefined,
        field: sp.get("field") || undefined,
        degree: sp.get("degree") || undefined,
        funding: sp.get("funding") || undefined,
        status: sp.get("status") || undefined,
        fullyFunded: sp.get("fullyFunded") === "1" || undefined,
        featured: sp.get("featured") === "1" || undefined,
        featuredOnly: sp.get("featuredOnly") === "1" || undefined,
        university: sp.get("university") || undefined,
        page: Math.max(1, Number(sp.get("page") ?? "1") || 1),
        limit: Math.min(60, Math.max(1, Number(sp.get("limit") ?? "12") || 12)),
        sort: (sp.get("sort") as "deadline" | "newest" | "title" | "featured") ?? "deadline",
      },
      closingSoonDays
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("[api/public/scholarships] Error fetching scholarships:", error);
    return NextResponse.json(
      { error: "Internal Server Error", data: [], pagination: { total: 0, pages: 0, current: 1 } },
      { status: 500 }
    );
  }
}
