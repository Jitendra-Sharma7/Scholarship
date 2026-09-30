import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * Liveness and readiness for an external uptime monitor.
 *
 * Deliberately not under `/api/public`, so `proxy.ts` does not gate it: the
 * monitor is a third party with no session and no API key, and a health check
 * that 404s is worse than no health check. It is outside `/api/public` for the
 * same reason the OAuth routes are — an external service has to reach it.
 *
 * The database is checked rather than assumed. Every public page is a server
 * component that reads Prisma directly, so an instance whose database is
 * unreachable returns 500 on all of them while the process itself looks healthy.
 * A monitor that only checked for a 200 on `/` would report the site as up
 * through exactly the failure that matters, because the static shell still
 * renders. Reporting 503 here is what makes that visible.
 *
 * Nothing about the failure is echoed back. The reason is logged server-side;
 * the response says only that the service is degraded, so the endpoint cannot be
 * used to confirm which host or credential is in play.
 */

const DB_TIMEOUT_MS = 5000;

export const dynamic = "force-dynamic";

/**
 * Prisma has no per-query timeout, and a monitor that hangs is indistinguishable
 * from one that never ran, so the wait is bounded here. The query is not
 * cancelled - it is left to fail on its own - but the caller stops waiting,
 * which is what keeps the response time honest when the database is wedged
 * rather than refusing connections.
 */
async function checkDatabase(): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`database check exceeded ${DB_TIMEOUT_MS}ms`)),
        DB_TIMEOUT_MS
      );
    });
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);
    return true;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET() {
  const startedAt = Date.now();

  let reachable = false;
  try {
    reachable = await checkDatabase();
  } catch (error) {
    console.error(
      "[health] database check failed:",
      error instanceof Error ? error.message : error
    );
  }

  if (!reachable) {
    return NextResponse.json(
      { status: "down", database: "unreachable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      status: "ok",
      database: "reachable",
      latencyMs: Date.now() - startedAt,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
