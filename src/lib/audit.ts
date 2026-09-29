import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Audit trail for administrative actions.
 *
 * Logging must never break the action it is recording, so every write is
 * best-effort: a failure is swallowed rather than surfaced to the admin, and
 * raw values are never included in `summary`.
 */

export type ActivityEntity =
  | "Scholarship"
  | "University"
  | "Country"
  | "Field"
  | "BlogPost"
  | "Resource"
  | "User"
  | "Submission"
  | "Media"
  | "Setting"
  | "Redirect"
  | "Auth";

export interface ActivityInput {
  action: string; // e.g. "scholarship.create", "user.role_change"
  entityType: ActivityEntity;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
  actor?: { id: string; email: string } | null;
}

export async function recordActivity(input: ActivityInput): Promise<void> {
  try {
    let ipAddress: string | null = null;
    try {
      const hdrs = await headers();
      ipAddress = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    } catch {
      // `headers()` is unavailable outside a request scope (e.g. a script).
    }

    await prisma.activityLog.create({
      data: {
        actorId: input.actor?.id ?? null,
        actorEmail: input.actor?.email ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
        metadata: input.metadata ?? undefined,
        ipAddress,
      },
    });
  } catch (error) {
    // Never let audit logging fail the operation it is describing.
    console.error("[audit] failed to record activity", {
      action: input.action,
      entityType: input.entityType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Convenience for recording a failed sign-in without leaking the password. */
export async function recordLoginFailure(email: string, reason: string): Promise<void> {
  await recordActivity({
    action: "auth.login_failed",
    entityType: "Auth",
    entityId: null,
    summary: `Failed sign-in for ${email || "(blank email)"}: ${reason}`,
    metadata: { email: email || null },
  });
}
