"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Last-resort error boundary for render failures outside any route's own
 * `error.tsx`.
 *
 * It replaces the whole document, so it must render its own `<html>` and
 * `<body>` and must not depend on the root layout, providers, or any shared
 * state: by definition it is used when those are what failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only handle support has on a production build; without
    // it a report cannot be tied to a server log entry.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-gray-50 font-sans text-gray-900 antialiased">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
          <p className="mb-3 inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Something went wrong
          </p>
          <h1 className="text-3xl font-extrabold text-gray-950">
            We could not load this page
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            The error has been logged. Try again, and if it keeps happening, head back to the
            scholarship directory.
          </p>
          {error.digest && (
            <p className="mt-4 text-xs text-gray-500">
              Reference: <span className="font-mono">{error.digest}</span>
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex min-h-[44px] items-center rounded-xl bg-primary-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              Try again
            </button>
            <Link
              href="/scholarships"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Browse scholarships
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
