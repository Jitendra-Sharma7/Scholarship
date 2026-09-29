"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { CookieConsent } from "@/components/consent/CookieConsent";

export function Providers({ children }: { children: React.ReactNode }) {
  // The consent banner is public-site chrome: it would otherwise cover the staff
  // panel on first load, and admin pages carry no visitor-facing tracking.
  const pathname = usePathname();
  const isStaffArea = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <>
      {children}
      {isStaffArea ? null : <CookieConsent />}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#1f2937",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          },
          success: {
            icon: "✅",
            style: {
              borderLeft: "4px solid #22c55e",
            },
          },
          error: {
            icon: "❌",
            style: {
              borderLeft: "4px solid #ef4444",
            },
          },
        }}
      />
    </>
  );
}