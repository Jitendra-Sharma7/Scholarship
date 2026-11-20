"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * University campus image.
 *
 * Renders the university's cover photograph when one is available, with a
 * designed initials fallback (never a broken image icon). Images are lazy
 * loaded, kept to a consistent aspect ratio, and never stretch the card layout.
 */
export function UniversityImage({
  src,
  alt,
  initials,
  className,
  priority = false,
}: {
  src: string | null;
  alt: string;
  /** Override the auto-computed initials shown in the fallback state. */
  initials?: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;
  const fallbackInitials = initials ?? computeInitials(alt);

  // Brand-safe fallback colours: blue/indigo slate tones only.
  const bg = [
    "bg-primary-100",
    "bg-indigo-100",
    "bg-blue-100",
    "bg-slate-100",
    "bg-primary-50",
  ] [hashToIndex(fallbackInitials)];

  const text = [
    "text-primary-700",
    "text-indigo-700",
    "text-blue-700",
    "text-slate-700",
    "text-primary-800",
  ] [hashToIndex(fallbackInitials)];

  return (
    <span
      className={cn(
        "relative block overflow-hidden rounded-xl bg-gray-50",
        className
      )}
    >
      {!showFallback && (
        // eslint-disable-next-line @next/next/no-img-element
        <Image
          fill
          src={src!}
          alt={alt}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{
            objectFit: "cover",
            display: "block",
          }}
        />
      )}
      {showFallback && (
        <span
          aria-label={`${alt} - image not available`}
          className={cn(
            "flex h-full w-full items-center justify-center",
            bg,
            text
          )}
        >
          <span className="text-2xl font-bold tracking-tighter">
            {fallbackInitials}
          </span>
        </span>
      )}
    </span>
  );
}

function computeInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .slice(0, 2);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function hashToIndex(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 5;
  }
  return hash;
}

export function UniversitySkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-gray-200 bg-white",
        className
      )}
    >
      <span className="aspect-[16/9] rounded-t-xl bg-gray-200 animate-pulse" />
      <div className="p-5">
        <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded mb-2" />
        <div className="h-3 w-full bg-gray-200 animate-pulse rounded mb-1" />
        <div className="h-3 w-1/2 bg-gray-200 animate-pulse rounded" />
      </div>
      <div className="h-2 px-5 pb-5 w-1/3 bg-gray-200 animate-pulse rounded-b-xl" />
    </div>
  );
}

export function UniversitySkeletonGrid({
  count = 6,
}: {
  count?: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <UniversitySkeleton key={i} className="min-h-[520px]" />
      ))}
    </div>
  );
}

export function UniversitySkeletonList({
  count = 6,
}: {
  count?: number;
}) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 animate-pulse"
        >
          <span className="shrink-0 h-16 w-24 rounded-lg bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-200 rounded" />
            <div className="h-3 w-1/3 bg-gray-200 rounded" />
          </div>
          <div className="h-8 w-32 rounded-lg bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
