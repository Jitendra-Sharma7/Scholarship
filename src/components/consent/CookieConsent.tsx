"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Cookie, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  CONSENT_CATEGORIES,
  type ConsentCategory,
  type ConsentDecision,
  resetConsent,
  saveConsent,
} from "@/lib/consent";
import { useConsentState } from "@/lib/useConsent";
import Link from "next/link";

type DialogMode = "banner" | "preferences";

/** Categories a visitor can actually switch. "essential" is always on. */
type OptionalCategory = Exclude<ConsentCategory, "essential">;

export function CookieConsent() {
  // `null` during SSR and the hydration pass, then the stored decision. Reading
  // localStorage inside an effect would need a setState there, which React flags
  // as a cascading render; the external store avoids both that and a flash of
  // the banner on every page load.
  const stored = useConsentState();

  const [mode, setMode] = useState<DialogMode>("banner");
  const [dismissed, setDismissed] = useState(false);
  const [decision, setDecision] = useState<ConsentDecision>({
    functional: false,
    analytics: false,
    marketing: false,
  });

  // Adopt the stored choice as the working draft whenever it changes.
  const storedKey = stored ? `${stored.functional}|${stored.analytics}|${stored.marketing}` : "";
  const [lastStoredKey, setLastStoredKey] = useState(storedKey);
  if (lastStoredKey !== storedKey) {
    setLastStoredKey(storedKey);
    if (stored) {
      setDecision({
        functional: stored.functional,
        analytics: stored.analytics,
        marketing: stored.marketing,
      });
    }
  }

  /**
   * First visit opens the banner. Once a decision is recorded the dialog stays
   * closed: the public site carries no standing "cookie settings" control, and
   * withdrawal happens from the Cookie Policy page instead, which raises
   * `gs:open-consent` to reopen this same dialog in preferences mode.
   */
  const open = !dismissed && (stored === null || mode === "preferences");

  const save = useCallback((next: ConsentDecision) => {
    saveConsent(next);
    setDecision(next);
    setDismissed(true);
    setMode("banner");
  }, []);

  const acceptAll = useCallback(() => {
    save({ functional: true, analytics: true, marketing: true });
  }, [save]);

  const rejectNonEssential = useCallback(() => {
    save({ functional: false, analytics: false, marketing: false });
  }, [save]);

  /** Reopen the dialog from the Cookie Policy page, via a custom event. */
  useEffect(() => {
    const openDialog = () => {
      setMode("preferences");
      setDismissed(false);
    };
    window.addEventListener("gs:open-consent", openDialog);
    return () => window.removeEventListener("gs:open-consent", openDialog);
  }, []);

  const toggle = (id: ConsentCategory, locked: boolean) => {
    if (locked) return;
    const key = id as OptionalCategory;
    setDecision((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-title"
          onKeyDown={(e) => {
            if (e.key === "Escape" && mode === "preferences") {
              setDismissed(true);
            }
          }}
        >
          {mode === "banner" ? (
            /* First visit: a centred card, no category detail to read through. */
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xl">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Cookie className="h-5 w-5" />
              </div>

              <h2 id="consent-title" className="text-base font-bold text-gray-900">
                We value your privacy
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                We use cookies to enhance your browsing experience, serve personalised ads or
                content, and analyse our traffic. By clicking &ldquo;Accept All&rdquo;, you consent
                to our use of cookies. See our{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-primary-600 underline hover:text-primary-700"
                >
                  privacy
                </Link>{" "}
                and{" "}
                <Link
                  href="/cookies"
                  className="font-medium text-primary-600 underline hover:text-primary-700"
                >
                  cookies policy
                </Link>
                .
              </p>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("preferences")}
                  className="sm:order-1"
                >
                  Customise
                </Button>
                <Button variant="outline" size="sm" onClick={rejectNonEssential}>
                  Reject All
                </Button>
                <Button variant="primary" size="sm" onClick={acceptAll}>
                  Accept All
                </Button>
              </div>
            </div>
          ) : (
            /* Customised view: the per-category detail, so each switch means something. */
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <Cookie className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 id="consent-title" className="text-base font-bold text-gray-900">
                      Cookie preferences
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Change your choice at any time.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close preferences"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Category controls */}
              <div className="space-y-4 p-5 sm:p-6">
                <fieldset className="space-y-3">
                  <legend className="sr-only">Cookie categories</legend>
                  {CONSENT_CATEGORIES.map((cat) => {
                    const isOn = cat.locked ? true : decision[cat.id as OptionalCategory];
                    return (
                      <div
                        key={cat.id}
                        className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <label
                              htmlFor={`consent-${cat.id}`}
                              className="flex items-center gap-2 text-sm font-semibold text-gray-900"
                            >
                              {cat.label}
                              {cat.locked && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                                  <ShieldCheck className="h-3 w-3" />
                                  Always on
                                </span>
                              )}
                              {!cat.locked && !cat.active && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                  Not currently set
                                </span>
                              )}
                            </label>
                            <p className="mt-1 text-xs leading-relaxed text-gray-600">
                              {cat.description}
                            </p>
                            {cat.examples.length > 0 && (
                              <ul className="mt-2 space-y-0.5">
                                {cat.examples.map((ex) => (
                                  <li
                                    key={ex}
                                    className="text-[11px] text-gray-500 before:mr-1.5 before:text-gray-400 before:content-['•']"
                                  >
                                    {ex}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <button
                            id={`consent-${cat.id}`}
                            type="button"
                            role="switch"
                            aria-checked={isOn}
                            aria-label={`${cat.label} cookies`}
                            disabled={cat.locked}
                            onClick={() => toggle(cat.id, cat.locked)}
                            className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                              isOn ? "bg-primary-600" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                isOn ? "translate-x-5" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </fieldset>

                <p className="text-xs leading-relaxed text-gray-500">
                  Read our{" "}
                  <Link
                    href="/privacy"
                    className="font-medium text-primary-600 underline hover:text-primary-700"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/cookies"
                    className="font-medium text-primary-600 underline hover:text-primary-700"
                  >
                    Cookie Policy
                  </Link>{" "}
                  for full details. Withdrawing consent is as easy as granting it.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    resetConsent();
                    setDecision({ functional: false, analytics: false, marketing: false });
                  }}
                >
                  Clear choice
                </Button>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" size="sm" onClick={rejectNonEssential}>
                    Reject All
                  </Button>
                  <Button variant="primary" size="sm" onClick={save.bind(null, decision)}>
                    Save preferences
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
