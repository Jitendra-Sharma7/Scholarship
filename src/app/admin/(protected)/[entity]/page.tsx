import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/admin/ui/primitives";
import { atLeast, getCurrentUser, isStaff, requireStaff } from "@/lib/auth";
import { getEntity, isGenericEntitySegment } from "@/lib/admin-registry";
import { getEntityOptions, listEntity } from "@/lib/admin-entity-queries";
import { EntityTable, type EntityRow } from "@/components/admin/entities/EntityTable";
import type { FilterField } from "@/components/admin/ui/DataTable";

/**
 * List view for every registry-driven admin section.
 *
 * The dynamic segment is resolved against the registry, so `/admin/nonsense`
 * 404s instead of rendering an empty shell, and the three sections that need real
 * workflows (submissions, activity, settings) keep their own bespoke routes.
 */

export const metadata = { title: "Content" };

function parseFilters(params: Record<string, string | string[] | undefined>) {
  const one = (key: string) => {
    const v = params[key];
    return typeof v === "string" && v !== "" ? v : undefined;
  };
  const pageRaw = Number(one("page") ?? "1");
  const dir = one("dir");

  return {
    q: one("q"),
    sort: one("sort"),
    dir: dir === "asc" ? ("asc" as const) : dir === "desc" ? ("desc" as const) : undefined,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
    trashed: one("trashed") === "1",
    status: one("status"),
    featured: one("featured"),
    role: one("role"),
    suspended: one("suspended"),
    countryId: one("countryId"),
    type: one("type"),
  };
}

/** Turn the registry's filter refs into the options the toolbar renders. */
function buildFilters(
  entityKey: string,
  options: Awaited<ReturnType<typeof getEntityOptions>>
): FilterField[] {
  const entity = getEntity(entityKey);
  if (!entity) return [];

  return entity.filters.map((filter) => {
    switch (filter.ref) {
      case "countries":
        return {
          name: filter.name,
          label: filter.label,
          options: options.countries.map((c) => ({ value: c.id, label: c.name })),
        };
      case "publishStatus":
        return {
          name: filter.name,
          label: filter.label,
          options: [
            { value: "PUBLISHED", label: "Published" },
            { value: "DRAFT", label: "Draft" },
            { value: "ARCHIVED", label: "Archived" },
          ],
        };
      case "resourceType":
        return {
          name: filter.name,
          label: filter.label,
          options: ["GUIDE", "PDF", "DOCUMENT", "LINK", "VIDEO", "TEMPLATE"].map((t) => ({
            value: t,
            label: t.charAt(0) + t.slice(1).toLowerCase(),
          })),
        };
      case "role":
        return {
          name: filter.name,
          label: filter.label,
          options: [
            { value: "USER", label: "User" },
            { value: "EDITOR", label: "Editor" },
            { value: "ADMIN", label: "Admin" },
            { value: "SUPER_ADMIN", label: "Super admin" },
          ],
        };
      case "suspended":
        return {
          name: filter.name,
          label: filter.label,
          options: [
            { value: "no", label: "Active" },
            { value: "yes", label: "Suspended" },
          ],
        };
      default:
        return {
          name: filter.name,
          label: filter.label,
          options: [
            { value: "yes", label: "Featured" },
            { value: "no", label: "Not featured" },
          ],
        };
    }
  });
}

/**
 * Public path each entity's records appear under, without the slug.
 *
 * Only entities with a real public detail page are listed. Countries,
 * universities and fields are reached through a filtered listing rather than a
 * slug URL, so linking to `/countries/<slug>` would offer a 404.
 */
const PUBLIC_PREFIX: Record<string, string> = {
  blog: "/blog",
  resources: "/resources",
};

/**
 * Row keys composed into the second line under the title.
 *
 * Passed as data because a formatter function cannot cross the server/client
 * boundary, which is where this list is rendered.
 */
const SUBTITLE_FIELDS: Record<string, string[]> = {
  universities: ["country", "city"],
  countries: ["region", "capital"],
  fields: ["parentName", "category"],
  blog: ["category", "authorName"],
  resources: ["type", "category"],
  media: ["folder", "url"],
  users: ["email"],
};

export default async function AdminEntityListPage({
  params,
  searchParams,
}: {
  params: Promise<{ entity: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { entity: entityKey } = await params;
  if (!isGenericEntitySegment(entityKey)) notFound();

  const entity = getEntity(entityKey);
  if (!entity) notFound();

  await requireStaff();
  const user = await getCurrentUser();
  const role = user?.role;
  const canEdit = isStaff(role);
  const canDelete = atLeast(role, "ADMIN");

  const filters = parseFilters(await searchParams);
  const [{ rows, total, page, perPage }, options] = await Promise.all([
    listEntity(entity, filters),
    getEntityOptions(entityKey),
  ]);

  return (
    <>
      <PageHeader
        title={filters.trashed ? `Trash: ${entity.label}` : entity.label}
        description={
          filters.trashed
            ? `Trashed ${entity.label.toLowerCase()} are hidden from the site. Restore them, or delete them permanently.`
            : `${total.toLocaleString("en-GB")} record${total === 1 ? "" : "s"}. ${entity.description}`
        }
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          ...(filters.trashed
            ? [{ label: entity.label, href: `/admin/${entityKey}` }]
            : []),
          { label: filters.trashed ? "Trash" : entity.label },
        ]}
        actions={
          canEdit && !filters.trashed && entityKey !== "users" ? (
            <Link
              href={`/admin/${entityKey}/new`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add {entity.singular.toLowerCase()}
            </Link>
          ) : null
        }
      />

      <EntityTable
        entity={entity}
        rows={rows as EntityRow[]}
        total={total}
        page={page}
        perPage={perPage}
        trashed={filters.trashed ?? false}
        canEdit={canEdit}
        canDelete={canDelete}
        isSuperAdmin={role === "SUPER_ADMIN"}
        filters={buildFilters(entityKey, options)}
        publicPrefix={PUBLIC_PREFIX[entityKey]}
        subtitleFields={SUBTITLE_FIELDS[entityKey] ?? []}
      />
    </>
  );
}
