"use client";

import Script from "next/script";
import { useConsentState } from "@/lib/useConsent";

export default function AdSenseScript() {
  const consent = useConsentState();

  // Load Google AdSense only when marketing consent is granted
  if (!consent?.marketing) {
    return null;
  }

  return (
    <Script
      id="google-adsense-script"
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6190025929296653"
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}