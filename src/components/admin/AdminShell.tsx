"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Sidebar, type ShellUser } from "@/components/admin/Sidebar";
import { GlobalSearch } from "@/components/admin/GlobalSearch";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ADMIN_HOME, navSectionsForRole } from "@/lib/admin-nav";
import type { AdminRoleName } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

function pageTitle(pathname: string): string {
  const sections = navSectionsForRole("SUPER_ADMIN");
  for (const section of sections) {
    for (const item of section.items) {
      const match = item.matchPrefix
        ? pathname === item.href || pathname.startsWith(`${item.href}/`)
        : pathname === item.href;
      if (match) return item.label;
    }
  }
  if (pathname === ADMIN_HOME) return "Dashboard";
  if (pathname.startsWith("/admin/scholarships/new")) return "New scholarship";
  if (pathname.startsWith("/admin/universities/new")) return "New university";
  if (pathname.startsWith("/admin/countries/new")) return "New country";
  if (pathname.startsWith("/admin/fields/new")) return "New field";
  if (pathname.startsWith("/admin/blog/new")) return "New blog post";
  if (pathname.startsWith("/admin/resources/new")) return "New resource";
  return "Admin";
}

/**
 * Admin chrome: fixed sidebar on desktop, slide-over drawer on small screens.
 *
 * The drawer closes on navigation and locks background scroll while open.
 */
export function AdminShell({
  user,
  unreadCount,
  children,
}: {
  user: ShellUser;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const role = user.role as AdminRoleName;

  // Close the drawer whenever the route changes. Adjusting during render closes
  // it on the same commit as the navigation instead of leaving it briefly open.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar role={role} user={user} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/60"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className={cn(
              "absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl",
              "animate-in slide-in-from-left duration-200"
            )}
          >
            <Sidebar role={role} user={user} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <h1 className="hidden shrink-0 text-base font-semibold text-slate-900 sm:block">
            {pageTitle(pathname)}
          </h1>

          <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:gap-3">
            <GlobalSearch />
            <NotificationBell initialUnread={unreadCount} />
            <Link
              href="/"
              className="hidden rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 sm:block"
            >
              View site
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
