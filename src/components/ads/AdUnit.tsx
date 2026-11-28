
"use client";

import { useEffect, useState } from "react";
import { useConsentState } from "@/lib/useConsent";

declare global {
    interface Window {
        adsbygoogle?: Array<Record<string, unknown>>;
        adsenseScriptReady?: boolean;
    }
}

interface AdUnitProps {
    _slot: string;
    _format?: string;
    responsive?: boolean;
    className?: string;
}

export default function AdUnit({
    _slot,
    _format = "auto",
    responsive = true,
    className = "",
}: AdUnitProps) {
    const consent = useConsentState();
    const [scriptReady, setScriptReady] = useState(false);

    useEffect(() => {
        const checkScript = () => {
            setScriptReady(
                window.adsenseScriptReady === true
            );
        };

        checkScript();

        window.addEventListener(
            "adsense-script-ready",
            checkScript
        );

        return () => {
            window.removeEventListener(
                "adsense-script-ready",
                checkScript
            );
        };
    }, []);

    useEffect(() => {
        if (!consent?.marketing || !scriptReady) {
            return;
        }

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
            console.error("Google AdSense initialization error:", error);
        }
    }, [consent?.marketing, scriptReady]);

    if (!consent?.marketing) {
        return null;
    }

    return (
        <div className={className}>
            <ins
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client="ca-pub-6190025929296653"
                data-ad-slot={5893622679}
                data-ad-format={responsive}
                data-full-width-responsive={
                    responsive ? "true" : "false"
                }
            />
        </div>
    );
}