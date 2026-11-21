"use client";

import { DirectoryNavbar } from "@/components/public/DirectoryNavbar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function UniversitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <DirectoryNavbar />
      <div className="flex-1">{children}</div>
    </ThemeProvider>
  );
}
