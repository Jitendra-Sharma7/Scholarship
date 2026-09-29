"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, GraduationCap, LogOut, ShieldCheck, X } from "lucide-react";

import { navSectionsForRole, isActivePath, type AdminRoleName } from "@/lib/admin-nav";
import { logoutAction } from "@/app/actions/auth-actions";
import { cn } from "@/lib/utils";

export interface ShellUser {
  name: string | null;
  email: string;
  role: AdminRoleName;
}

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  EDITOR: "bg-emerald-100 text-emerald-700",
};

export function Sidebar({
  role,
  user,
  onNavigate,
}: {
  role: AdminRoleName;
  user: ShellUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = navSectionsForRole(role);

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-800 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <GraduationCap className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">
            Global Scholarship Hub
          </span>
          <span className="block text-[11px] text-slate-400">Content management</span>
        </span>
      </div>

      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            <h2 className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {section.title}
            </h2>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActivePath(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-slate-800 font-medium text-white"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-800 p-3">
        <Link
          href="/"
          className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-100"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          View public site
        </Link>

        <div className="rounded-xl bg-slate-800/60 p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-white">
                {user.name || "Administrator"}
              </span>
              <span className="block truncate text-[11px] text-slate-400">{user.email}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                ROLE_BADGE[user.role] ?? "bg-slate-700 text-slate-200"
              )}
            >
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {user.role.replace("_", " ")}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <LogOut className="h-3 w-3" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Close button rendered inside the mobile drawer. */
export function DrawerClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close navigation"
      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
    >
      <X className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
