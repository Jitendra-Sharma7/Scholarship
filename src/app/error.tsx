"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Layout";
import { AlertCircle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Route error:", error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mb-6">
        <AlertCircle strokeWidth={2} className="h-8 w-8" />
      </div>
      <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl mb-4">
        Something went wrong!
      </h2>
      <p className="text-gray-600 text-lg mb-8 max-w-md">
        An unexpected error occurred while loading this page. Our team has been notified.
      </p>

      {error.digest && (
        <p className="text-xs text-gray-500 mb-8 font-mono bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          Error Ref: {error.digest}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 min-w-[200px] w-full sm:w-auto">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Go Home
        </Link>
      </div>
    </Container>
  );
}
