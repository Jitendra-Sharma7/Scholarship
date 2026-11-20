
"use client";

import { useEffect } from "react";

import { loadScriptIfConsented } from "@/lib/consent";
import { useConsentState } from "@/lib/useConsent";

const ADSENSE_PUBLISHER_ID = "ca-pub-6190025929296653";

const ADSENSE_SRC =
  `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`;

/**
 * Google AdSense integration.
 *
 * Features:
 * - Loads AdSense only after marketing consent.
 * - Prevents loading before a consent decision.
 * - Uses the existing consent management system.
 * - Supports visitors accepting consent after initially declining.
 * - Avoids duplicate script loading through the existing
 *   loadScriptIfConsented implementation.
 */
export function AdSenseScript() {
  const consent = useConsentState();

  useEffect(() => {
    if (!consent) {
      return;
    }

    loadScriptIfConsented(
      ADSENSE_SRC,
      "marketing",
      consent
    );
  }, [consent]);

  return null;
}
