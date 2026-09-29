"use client";

import { useSyncExternalStore } from "react";

/**
 * A hydration-safe "current time" for deadline arithmetic.
 *
 * Calling `Date.now()` during render makes output differ between the server
 * pass and hydration, which React reports as a hydration mismatch — and on a
 * deadline list it can reorder results between the two passes.
 *
 * `useSyncExternalStore` is the supported way to read a browser-only value: it
 * returns the server snapshot for the server pass and the hydration pass, then
 * the real value afterwards. There is no setState-in-effect and no flash of
 * time-dependent output.
 */

/**
 * Cached so `getSnapshot` is stable across calls within a render pass. React
 * throws on a changing snapshot, so recomputing `Date.now()` per call is not
 * an option. The value therefore refreshes on reload rather than on a timer,
 * which is the right granularity for a deadline countdown.
 */
let cachedNow: number | null = null;

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): number {
  if (cachedNow === null) cachedNow = Date.now();
  return cachedNow;
}

/** Zero is the sentinel meaning "no stable time available yet". */
function getServerSnapshot(): number {
  return 0;
}

/** Returns `null` until a real timestamp is available on the client. */
export function useNow(): number | null {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return value === 0 ? null : value;
}

/** Whole days from `from` until `to`. Null-safe; null when the date is absent. */
export function daysUntilFrom(
  from: number,
  to: string | Date | null | undefined
): number | null {
  if (to === null || to === undefined || to === "") return null;
  const target = new Date(to).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - from) / 86_400_000);
}
