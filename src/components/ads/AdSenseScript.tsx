
"use client";

import Script from "next/script";
import { useConsentState } from "@/lib/useConsent";

const ADSENSE_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6190025929296653";

declare global {
  interface Window {
    adsenseScriptReady?: boolean;
  }
}

export default function AdSenseScript() {
  const consent = useConsentState();

  if (!consent?.marketing) {
    return null;
  }

  return (
    <Script
      id="google-adsense-script"
      src={ADSENSE_SRC}
      strategy="afterInteractive"
      async
      crossOrigin="anonymous"
      onReady={() => {
        window.adsenseScriptReady = true;

        window.dispatchEvent(
          new Event("adsense-script-ready")
        );
      }}
    />
  );
}