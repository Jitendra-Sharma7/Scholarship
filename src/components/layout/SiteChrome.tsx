"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { SiteBranding } from "@/lib/site-branding";

/** The staff panel and its sign-in page live under this prefix. */
function isStaffArea(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Public site chrome, suppressed inside the staff panel.
 *
 * The admin area provides its own header, sidebar and shell, so rendering the
 * marketing header and footer around it duplicated navigation and left staff
 * pages linking back into the public site. Both are client components already,
 * so gating on the pathname costs nothing and matches on the server render,
 * which keeps admin pages free of a flash of public chrome.
 */
export function SiteChrome({
  children,
  branding,
}: {
  children: React.ReactNode;
  branding: SiteBranding;
}) {
  const pathname = usePathname();

  if (isStaffArea(pathname)) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer branding={branding} />
    </div>
  );
}
