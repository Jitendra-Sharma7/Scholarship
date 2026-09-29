import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * Dashboard shortcuts for creating new content.
 *
 * Intentionally a server component: the entries carry lucide icon components,
 * and functions cannot be serialized across the server/client boundary.
 */
export function QuickActions({
  actions,
}: {
  actions: readonly { href: string; label: string; icon: LucideIcon }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-4 text-center transition-all hover:border-blue-300 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-medium text-slate-700">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
