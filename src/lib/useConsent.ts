"use client";

import { useSyncExternalStore } from "react";
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  subscribeToConsent,
  type ConsentState,
} from "@/lib/consent";

/**
 * Reads the stored consent decision as an external store.
 *
 * Returns `null` while server rendering and on the hydration pass, then the real
 * value afterwards. Callers can therefore branch on `null` to render a
 * placeholder without risking a hydration mismatch.
 */
export function useConsentState(): ConsentState | null {
  return useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getConsentServerSnapshot
  );
}
