import Link from "next/link";
import { Trash2 } from "lucide-react";

import { requireStaff, getCurrentUser, atLeast } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState, Badge } from "@/components/admin/ui/primitives";
import { formatDate } from "@/lib/utils";
import { TrashRestoreButton } from "@/components/admin/trash/TrashRestoreButton";

export const metadata = { title: "Trash" };

export const dynamic = "force-dynamic";

/** Content types that support soft delete, so the trash can be one view. */
const TRASH_TABS = [
  { key: "scholarships", label: "Scholarships", href: "/admin/trash?type=scholarships" },
  { key: "resources", label: "Resources", href: "/admin/trash?type=resources" },
] as const;

type TabKey = (typeof TRASH_TABS)[number]["key"];

export default async function TrashPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireStaff();
  const { type } = await searchParams;
  const active: TabKey = TRASH_TABS.some((t) => t.key === type) ? (type as TabKey) : "scholarships";
  const user = await getCurrentUser();
  const canRestore = atLeast(user?.role, "ADMIN") ?? false;

  const [scholarships, resources] = await Promise.all([
    prisma.scholarship.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        slug: true,
        publishStatus: true,
        deletedAt: true,
        country: { select: { name: true } },
      },
    }),
    prisma.resource.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      take: 100,
      select: { id: true, title: true, slug: true, deletedAt: true },
    }),
  ]);

  const rows = active === "scholarships" ? scholarships : resources;
  const counts: Record<TabKey, number> = {
    scholarships: scholarships.length,
    resources: resources.length,
  };

  return (
    <>
      <PageHeader
        title="Trash"
        description="Deleted content is hidden from the public site and can be restored. Removing it permanently is a separate, irreversible step."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Trash" }]}
      />

      <nav aria-label="Trash sections" className="mb-4 flex flex-wrap gap-1.5">
        {TRASH_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active === tab.key ? "page" : undefined}
            className={
              active === tab.key
                ? "inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
                : "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            }
          >
            {tab.label}
            {counts[tab.key] > 0 ? (
              <span
                className={
                  active === tab.key
                    ? "rounded-full bg-white/20 px-1.5 text-[11px] tabular-nums"
                    : "rounded-full bg-slate-100 px-1.5 text-[11px] tabular-nums text-slate-600"
                }
              >
                {counts[tab.key]}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          title={`No deleted ${active}`}
          description="Anything you delete appears here and can be restored."
          icon={<Trash2 className="h-5 w-5" aria-hidden="true" />}
        />
      ) : active === "scholarships" ? (
        <TrashList
          items={scholarships.map((s) => ({
            id: s.id,
            title: s.title,
            href: `/admin/scholarships/${s.id}/edit`,
            deletedAt: s.deletedAt,
            meta: (
              <>
                <Badge tone="neutral">{s.publishStatus.toLowerCase()}</Badge>
                {s.country?.name ? <span>{s.country.name}</span> : null}
              </>
            ),
          }))}
          model="scholarship"
          canRestore={canRestore}
        />
      ) : (
        <TrashList
          items={resources.map((r) => ({
            id: r.id,
            title: r.title,
            href: `/admin/resources/${r.id}/edit`,
            deletedAt: r.deletedAt,
            meta: null,
          }))}
          model="resource"
          canRestore={canRestore}
        />
      )}
    </>
  );
}

/** Shared row list for the active tab. */
function TrashList({
  items,
  model,
  canRestore,
}: {
  items: {
    id: string;
    title: string;
    href: string;
    deletedAt: Date | null;
    meta: React.ReactNode;
  }[];
  model: "scholarship" | "resource";
  canRestore: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <Link
                href={item.href}
                className="truncate text-sm font-medium text-slate-900 hover:text-blue-700 hover:underline"
              >
                {item.title}
              </Link>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {item.meta}
                {item.deletedAt ? <span>Deleted {formatDate(item.deletedAt)}</span> : null}
              </p>
            </div>
            <TrashRestoreButton model={model} id={item.id} canRestore={canRestore} />
          </li>
        ))}
      </ul>
    </div>
  );
}
