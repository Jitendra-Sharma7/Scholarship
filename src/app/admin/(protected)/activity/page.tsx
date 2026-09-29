import { PageHeader } from "@/components/admin/ui/primitives";
import { requireRole } from "@/lib/auth";
import { activityFacets, listActivity } from "@/lib/admin-activity";
import { ActivityLogTable } from "@/components/admin/activity/ActivityLogTable";

/**
 * Audit trail.
 *
 * ADMIN and above only, because a log of who changed what is sensitive in
 * itself. Read-only: see the component for why there are no edit controls.
 */

export const metadata = { title: "Activity log" };

function parseFilters(params: Record<string, string | string[] | undefined>) {
  const one = (key: string) => {
    const v = params[key];
    return typeof v === "string" && v !== "" ? v : undefined;
  };
  const pageRaw = Number(one("page") ?? "1");

  return {
    q: one("q"),
    action: one("action"),
    entityType: one("entityType"),
    actorId: one("actorId"),
    from: one("from"),
    to: one("to"),
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  };
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("ADMIN");

  const filters = parseFilters(await searchParams);
  const [{ rows, total, page, perPage }, facets] = await Promise.all([
    listActivity(filters),
    activityFacets(),
  ]);

  return (
    <>
      <PageHeader
        title="Activity log"
        description="Every administrative change, most recent first. Entries are written by the server and cannot be edited from here."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Activity log" }]}
      />

      <ActivityLogTable rows={rows} total={total} page={page} perPage={perPage} facets={facets} />
    </>
  );
}
