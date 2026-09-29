import { fromPrismaDeadlineStatus, type DeadlineStatusValue } from "@/lib/enums";

/**
 * Pure deadline evaluation.
 *
 * Deliberately separate from `lib/deadline.ts` so the admin editor - a client
 * component - can import it. This module must never reach for the database or
 * any other server-only dependency, otherwise the Prisma client would be pulled
 * into the browser bundle.
 *
 * Deadline status is derived from the application window, never stored by hand.
 * Admins never have to remember to expire a scholarship: as soon as the deadline
 * passes, reads report `Expired`. A stored override still wins so an admin can
 * hold a listing open past its nominal date (for example when an official
 * deadline was extended).
 *
 * A missing deadline is treated as `Expired` rather than `Upcoming`: an undated
 * opportunity cannot be applied to, so keeping it in the default public listing
 * would overstate what a visitor can act on.
 */

export interface DeadlineInput {
  deadline: Date | null;
  openingDate?: Date | null;
  /** Admins can pin a status; `null` or `""` means "calculate it". */
  override?: string | null;
  /** Days before the deadline at which it counts as closing soon. */
  closingSoonDays?: number;
  /** Reference time, injectable so tests are deterministic. */
  now?: Date;
}

export interface DeadlineResult {
  status: DeadlineStatusValue;
  /** Whole days until the deadline; negative once it has passed. */
  daysRemaining: number;
  isActionable: boolean;
}

export function evaluateDeadlineSync(input: DeadlineInput): DeadlineResult {
  const now = input.now ?? new Date();
  const closingSoonDays = input.closingSoonDays ?? 14;
  const deadline = input.deadline ?? null;
  const openingDate = input.openingDate ?? null;

  const daysRemaining = deadline
    ? Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    : Number.NEGATIVE_INFINITY;

  let calculated: DeadlineStatusValue;
  if (!deadline) {
    calculated = "Expired";
  } else if (daysRemaining < 0) {
    calculated = "Expired";
  } else if (openingDate && openingDate.getTime() > now.getTime()) {
    calculated = "Opening Soon";
  } else if (daysRemaining <= closingSoonDays) {
    calculated = "Closing Soon";
  } else {
    calculated = "Open";
  }

  // Only trust an override that is one of the real statuses.
  const override = input.override ? fromPrismaDeadlineStatus(input.override) : null;
  const status = override ?? calculated;

  return {
    status,
    daysRemaining,
    // `Upcoming` and `Expired` cannot be applied to right now.
    isActionable: status === "Open" || status === "Closing Soon" || status === "Opening Soon",
  };
}

/** Statuses the public site shows by default (everything still applicable). */
export const DEFAULT_PUBLIC_STATUSES: DeadlineStatusValue[] = [
  "Open",
  "Opening Soon",
  "Closing Soon",
];
