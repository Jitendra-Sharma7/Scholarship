"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The site mark: the diploma-hat logo, linking home.
 *
 * One component for the header and the footer so the two cannot drift. The logo
 * is a mid-tone image, which is why it reads on the white header and the dark
 * footer without needing a separate inverted version.
 *
 * `tone` is the only thing that differs between the two call sites: the header
 * sits on white and needs dark text, the footer on gray-900 and needs light.
 */
export function SiteLogo({
  tone = "dark",
  size = 40,
  className,
}: {
  tone?: "dark" | "light";
  size?: number;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="Global Scholarship Hub, home"
      className={cn("flex items-center gap-2", className)}
    >
      <Image
        src="/diploma_hat.png"
        alt=""
        width={size}
        height={size}
        priority
        className="shrink-0"
        style={{ width: size, height: size }}
      />
      {/* The wordmark is hidden on the narrowest screens, where the header bar
          has no room for it alongside the account controls and the menu
          toggle. The icon tile alone still identifies the site. */}
      <span
        className={cn(
          "hidden text-lg font-bold sm:inline xl:text-xl",
          tone === "light" ? "text-white" : "text-gray-900"
        )}
      >
        Global Scholarship Hub
      </span>
    </Link>
  );
}
