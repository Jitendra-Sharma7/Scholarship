"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

type FlagSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface CountryFlagProps {
  /** ISO 3166-1 alpha-2 code, e.g. "DE", "GB", "US", "CA" */
  code?: string | null;
  /** Emoji fallback for when the flag image cannot be loaded */
  emoji?: string | null;
  /** Accessible name. Leave undefined when the flag sits next to visible country text. */
  name?: string;
  size?: FlagSize;
  className?: string;
  rounded?: boolean;
}

const SIZES: Record<FlagSize, { px: number; cls: string }> = {
  xs: { px: 16, cls: "h-3 w-4" },
  sm: { px: 20, cls: "h-4 w-[1.25rem]" },
  md: { px: 28, cls: "h-5 w-6" },
  lg: { px: 36, cls: "h-7 w-9" },
  xl: { px: 48, cls: "h-9 w-12" },
  "2xl": { px: 64, cls: "h-12 w-16" },
};

/**
 * Renders a real flag image instead of a flag emoji.
 *
 * Windows does not render regional-indicator flag emoji (🇩🇪 shows up as the
 * letters "DE"), so emoji cannot be used for country identification.
 */
export function CountryFlag({
  code,
  emoji,
  name,
  size = "md",
  className,
  rounded = true,
}: CountryFlagProps) {
  const [failed, setFailed] = useState(false);
  const { px, cls } = SIZES[size];

  // Decorative when no name is given and the country label is already visible.
  const alt = name ? `${name} flag` : "";

  if (!code || failed) {
    if (emoji) {
      return (
        <span
          role={name ? "img" : undefined}
          aria-label={name ? `${name} flag` : undefined}
          aria-hidden={name ? undefined : true}
          className={cn("inline-flex items-center justify-center leading-none", cls, className)}
        >
          {emoji}
        </span>
      );
    }

    // No flag image. Showing an empty grey rectangle reads as a broken image, so
    // the ISO code is shown in its place instead: still identifying, and it
    // looks deliberate rather than unfinished.
    if (code) {
      return (
        <span
          role={name ? "img" : undefined}
          aria-label={name ? `${name}, code ${code}` : undefined}
          aria-hidden={name ? undefined : true}
          title={name}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-sm border border-gray-300 bg-gray-100 font-semibold uppercase leading-none text-gray-600",
            cls,
            className
          )}
          style={{ fontSize: Math.max(8, Math.round(px * 0.42)) }}
        >
          {code}
        </span>
      );
    }

    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center justify-center rounded-sm bg-gray-200 leading-none",
          cls,
          className
        )}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt={alt}
      title={name}
      width={Math.round((px * 4) / 3)}
      height={px}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn(
        "inline-block shrink-0 border border-black/10 bg-gray-100 object-cover",
        rounded && "rounded-sm",
        cls,
        className
      )}
    />
  );
}

/**
 * Flag + country name. Use this anywhere a country is listed so the flag is
 * always a real image rather than a two-letter code.
 */
export function CountryFlagWithName({
  code,
  emoji,
  name,
  size = "sm",
  className,
  nameClassName,
}: Omit<CountryFlagProps, "rounded"> & { nameClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <CountryFlag code={code} emoji={emoji} name={name} size={size} />
      <span className={cn("truncate", nameClassName)}>{name}</span>
    </span>
  );
}
