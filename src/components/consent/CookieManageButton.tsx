"use client";

import React, { useEffect } from "react";

/**
 * Opens the shared cookie consent dialog from a server-rendered page by
 * dispatching the same custom event the footer control uses.
 */
export function CookieManageButton() {
  useEffect(() => {
    // no-op: the button relies on a plain DOM event, no hydration work needed
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("gs:open-consent"))}
      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      Manage cookie preferences
    </button>
  );
}
