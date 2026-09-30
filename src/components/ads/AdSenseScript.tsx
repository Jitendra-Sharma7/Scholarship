"use client";

import { useEffect } from "react";

import { loadScriptIfConsented } from "@/lib/consent";
import { useConsentState } from "@/lib/useConsent";

const ADSENSE_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6190025929296653";

/**
 * Loads AdSense under the `marketing` consent category.
 *
 * The script is not in the document head on the server. Adding it there would
 * fetch it on first paint and let Google set its cookies before the visitor has
 * answered the banner, which contradicts what /cookies states: third-party
 * advertising and measurement run "where you have [consented]". Consent-gating
 * also keeps the site consistent for EEA, UK and Swiss traffic, where Google
 * expects a consent platform in front of personalised ads.
 *
 * The effect re-runs when the decision changes, so a visitor who declines and
 * later accepts gets the script without a reload. `loadScriptIfConsented` is
 * idempotent and ignores a second attempt, so the render that immediately
 * follows an accept cannot double-load it.
 */
export function AdSenseScript() {
  const consent = useConsentState();

  useEffect(() => {
    if (!consent) return;
    loadScriptIfConsented(ADSENSE_SRC, "marketing", consent);
  }, [consent]);

  return null;
}
