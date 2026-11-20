import Link from "next/link";

import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui/primitives";
import { IntakeForm } from "@/components/admin/intakes/IntakeForm";

export const metadata = { title: "New intake" };

export default async function NewIntakePage() {
  await requireStaff();

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Intakes", href: "/admin/intakes" },
          { label: "New" },
        ]}
        title="Add intake"
        description="Create a new academic intake period for organizing scholarships."
        actions={
          <Link
            href="/admin/intakes"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </Link>
        }
      />

      <IntakeForm mode="create" />
    </>
  );
}