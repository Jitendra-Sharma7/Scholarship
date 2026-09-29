import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/admin/ui/primitives";
import { requireStaff } from "@/lib/auth";
import { getEntity, isGenericEntitySegment } from "@/lib/admin-registry";
import { blankEntityValues, slugPrefixFor, slugSourceFor } from "@/lib/admin-entity-form";
import { getEntityFormOptions } from "@/lib/admin-entity-queries";
import { EntityForm } from "@/components/admin/entities/EntityForm";
import { createEntityRecord } from "@/app/actions/admin-entity-actions";

/** Create page for every registry-driven admin section. */

export const metadata = { title: "New record" };

export default async function AdminEntityNewPage({
  params,
}: {
  params: Promise<{ entity: string }>;
}) {
  const { entity: entityKey } = await params;
  if (!isGenericEntitySegment(entityKey)) notFound();

  const entity = getEntity(entityKey);
  if (!entity) notFound();

  // Accounts come from sign-up; there is no way to invent a password here.
  if (entity.model === "user") redirect("/admin/users");

  await requireStaff();

  const options = await getEntityFormOptions(entityKey);

  return (
    <>
      <PageHeader
        title={`New ${entity.singular.toLowerCase()}`}
        description={entity.description}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: entity.label, href: `/admin/${entityKey}` },
          { label: "New" },
        ]}
      />

      <EntityForm
        entity={entity}
        mode="create"
        values={blankEntityValues(entity)}
        options={options}
        slugPrefix={slugPrefixFor(entityKey)}
        slugSource={slugSourceFor(entity)}
        action={createEntityRecord.bind(null, entityKey)}
      />
    </>
  );
}
