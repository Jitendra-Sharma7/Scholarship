"use client";

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function UniversitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="flex-1">{children}</div>
    </ThemeProvider>
  );
}
