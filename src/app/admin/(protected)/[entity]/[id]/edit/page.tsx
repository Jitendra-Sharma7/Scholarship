import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/ui/primitives";
import { requireStaff } from "@/lib/auth";
import { getEntity, isGenericEntitySegment } from "@/lib/admin-registry";
import {
  entityValuesFromRecord,
  isTrashed,
  slugPrefixFor,
  slugSourceFor,
} from "@/lib/admin-entity-form";
import { getEntityFormOptions, getEntityRecord } from "@/lib/admin-entity-queries";
import { EntityForm } from "@/components/admin/entities/EntityForm";
import { updateEntityRecord } from "@/app/actions/admin-entity-actions";

/** Edit page for every registry-driven admin section. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ entity: string; id: string }>;
}) {
  const { entity: entityKey } = await params;
  const entity = getEntity(entityKey);
  return { title: entity ? `Edit ${entity.singular.toLowerCase()}` : "Not found" };
}

export default async function AdminEntityEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ entity: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { entity: entityKey, id } = await params;
  if (!isGenericEntitySegment(entityKey)) notFound();

  const entity = getEntity(entityKey);
  if (!entity) notFound();

  await requireStaff();

  const [record, options, query] = await Promise.all([
    getEntityRecord(entity, id),
    getEntityFormOptions(entityKey),
    searchParams,
  ]);

  if (!record) notFound();

  const saved = query.saved === "1";
  const trashed = isTrashed(record);
  const label = String(record.name ?? record.title ?? record.originalName ?? record.email ?? id);

  return (
    <>
      <PageHeader
        title={label}
        description={
          trashed
            ? "This record is in the trash and hidden from the site."
            : entity.description
        }
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: entity.label, href: `/admin/${entityKey}` },
          { label: label },
        ]}
      />

      {saved ? (
        <p
          role="status"
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-900"
        >
          Changes saved.
        </p>
      ) : null}

      {trashed ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Trashed record. Saving does not restore it &mdash; restore it from{" "}
          <Link href={`/admin/${entityKey}?trashed=1`} className="font-medium underline">
            the trash
          </Link>{" "}
          when you are ready.
        </p>
      ) : null}

      <EntityForm
        entity={entity}
        mode="edit"
        values={entityValuesFromRecord(entity, record)}
        options={options}
        slugPrefix={slugPrefixFor(entityKey)}
        slugSource={slugSourceFor(entity)}
        action={updateEntityRecord.bind(null, entityKey, id)}
      />
    </>
  );
}
