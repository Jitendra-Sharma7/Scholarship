import { getSettingNumber } from "@/lib/settings";
import { fromPrismaDeadlineStatus, type DeadlineStatusValue } from "@/lib/enums";
import {
  evaluateDeadlineSync,
  DEFAULT_PUBLIC_STATUSES,
  type DeadlineInput,
  type DeadlineResult,
} from "@/lib/deadline-core";

/**
 * Server-side deadline evaluation.
 *
 * The rules live in `deadline-core`, which has no server dependencies, so the
 * admin editor can reuse the exact same logic in the browser. This module adds
 * the one thing the browser cannot do: read the configured closing-soon window.
 */

export type { DeadlineInput, DeadlineResult };
export { evaluateDeadlineSync, DEFAULT_PUBLIC_STATUSES };

export async function evaluateDeadline(input: DeadlineInput): Promise<DeadlineResult> {
  const closingSoonDays =
    input.closingSoonDays ?? (await getSettingNumber("scholarships.closingSoonDays", 14));
  return evaluateDeadlineSync({ ...input, closingSoonDays });
}

/** Re-exported so call sites that already import from here keep working. */
export { fromPrismaDeadlineStatus };
export type { DeadlineStatusValue };
