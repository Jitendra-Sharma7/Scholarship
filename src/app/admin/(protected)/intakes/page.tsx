import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/admin/ui/primitives";
import { atLeast, getCurrentUser, isStaff, requireStaff } from "@/lib/auth";
import { getIntakes, createIntake, seedDefaultIntakes } from "@/lib/data/intakes";
import { IntakeTable } from "@/components/admin/intakes/IntakeTable";

export const metadata = { title: "Intakes" };

export default async function AdminIntakesPage() {
  await requireStaff();
  const user = await getCurrentUser();
  const canEdit = isStaff(user?.role) && (atLeast(user?.role, "EDITOR") ?? false);
  const canDelete = atLeast(user?.role, "ADMIN") ?? false;

  const intakes = await getIntakes(true);

  return (
    <>
      <PageHeader
        title="Intakes"
        description="Manage academic intake periods for scholarship filtering."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Intakes" }]}
        actions={
          canEdit ? (
            <>
              <Link
                href="/admin/intakes/new"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add intake
              </Link>
              <form action={async () => { await seedDefaultIntakes(); }} className="inline">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Seed Defaults
                </button>
              </form>
            </>
          ) : null
        }
      />

      <IntakeTable
        intakes={intakes}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </>
  );
}