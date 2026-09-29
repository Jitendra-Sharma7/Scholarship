import React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Container({ children, className, size = "lg" }: ContainerProps) {
  const sizes = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-7xl",
    xl: "max-w-[1400px]",
    full: "max-w-none",
  };
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizes[size], className)}>
      {children}
    </div>
  );
}

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "xl";
  background?: "white" | "gray" | "primary" | "brand";
}

export function Section({ children, className, padding = "lg", background = "white" }: SectionProps) {
  const paddings = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
    xl: "py-20",
  };
  const backgrounds = {
    white: "bg-white",
    gray: "bg-gray-50",
    primary: "bg-primary-50",
    brand: "bg-brand-50",
  };
  return (
    <section className={cn(backgrounds[background], paddings[padding], className)}>
      {children}
    </section>
  );
}

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function Grid({ children, cols = 3, gap = "md", className }: GridProps) {
  const colStyles = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    7: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7",
  };
  const gapStyles = {
    sm: "gap-3",
    md: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8",
  };
  return (
    <div className={cn("grid", colStyles[cols], gapStyles[gap], className)}>
      {children}
    </div>
  );
}

interface FlexProps {
  children: React.ReactNode;
  direction?: "row" | "col";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  gap?: "sm" | "md" | "lg" | 0 | 1 | 1.5 | 2 | 2.5 | 3 | 4 | 5 | 6 | 8 | `${number}`;
  wrap?: boolean;
  className?: string;
}

export function Flex({ children, direction = "row", align = "center", justify = "start", gap = "md", wrap = false, className }: FlexProps) {
  const directions = { row: "flex-row", col: "flex-col" };
  const aligns = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" };
  const justifies = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between", around: "justify-around" };
  const gaps: Record<string, string> = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
    0: "gap-0",
    1: "gap-1",
    1.5: "gap-1.5",
    2: "gap-2",
    2.5: "gap-2.5",
    3: "gap-3",
    4: "gap-4",
    5: "gap-5",
    6: "gap-6",
    8: "gap-8",
  } as Record<string, string>;
  const gapClass =
    gap === "sm" || gap === "md" || gap === "lg"
      ? gaps[gap]
      : gaps[String(gap)] ?? `gap-${gap}`;
  return (
    <div className={cn("flex", directions[direction], aligns[align], justifies[justify], gapClass, wrap && "flex-wrap", className)}>
      {children}
    </div>
  );
}