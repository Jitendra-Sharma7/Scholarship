"use client";

import { useEffect, useRef } from "react";
import { useConsentState } from "@/lib/useConsent";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdUnitProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  className?: string;
}

const PUBLISHER_ID = "ca-pub-6190025929296653";

export default function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  className = "",
}: AdUnitProps) {
  const consent = useConsentState();
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!consent?.marketing) {
      pushedRef.current = false;
      return;
    }
    if (pushedRef.current) return;

    let cancelled = false;

    const tryPush = () => {
      if (cancelled || pushedRef.current) return;
      if (typeof window === "undefined" || !Array.isArray(window.adsbygoogle)) {
        window.setTimeout(tryPush, 200);
        return;
      }
      try {
        (window.adsbygoogle as Array<Record<string, unknown>>).push({});
        pushedRef.current = true;
      } catch (error) {
        console.error("Google AdSense initialization error:", error);
      }
    };

    tryPush();

    return () => {
      cancelled = true;
    };
  }, [consent?.marketing]);

  if (!consent?.marketing) {
    return null;
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
