import { NextResponse } from "next/server";

import {
  getPublicCountries,
  getPublicFields,
  getPublicProviders,
  getPublicScholarshipById,
  getPublicStats,
  getPublicUniversities,
} from "@/lib/data/public";
import { getSettingNumber } from "@/lib/settings";

/** Read-only public reference data used by client-rendered pages. */
export async function GET(request: Request, ctx: { params: Promise<{ resource: string }> }) {
  const { resource } = await ctx.params;
  const cache = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" };

  try {
    switch (resource) {
      case "countries":
        return NextResponse.json(await getPublicCountries(), { headers: cache });

      case "fields":
        return NextResponse.json(await getPublicFields(), { headers: cache });

      case "universities": {
        const url = new URL(request.url);
        const limitParam = url.searchParams.get("limit");
        const limit = limitParam ? Math.min(200, Math.max(1, Number(limitParam) || 1)) : undefined;
        return NextResponse.json(await getPublicUniversities(limit), { headers: cache });
      }

      case "providers":
        return NextResponse.json(await getPublicProviders(), { headers: cache });

      case "stats":
        return NextResponse.json(await getPublicStats(), { headers: cache });

      case "scholarship": {
        const id = new URL(request.url).searchParams.get("id");
        if (!id) {
          return NextResponse.json({ error: "id is required" }, { status: 400 });
        }
        const closingSoonDays = await getSettingNumber("scholarships.closingSoonDays", 14);
        const row = await getPublicScholarshipById(id, closingSoonDays);
        if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(row, { headers: cache });
      }

      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
    }
  } catch (error) {
    console.error(`[api/public/${resource}] Error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
