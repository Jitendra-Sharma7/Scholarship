import Link from "next/link";

import { requireStaff } from "@/lib/auth";
import { getEditorReferenceData } from "@/lib/admin-scholarships";
import { ScholarshipForm } from "@/components/admin/scholarships/ScholarshipForm";
import { PageHeader } from "@/components/admin/ui/primitives";

export const metadata = { title: "New scholarship" };

export default async function NewScholarshipPage() {
  await requireStaff();
  const reference = await getEditorReferenceData();

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Scholarships", href: "/admin/scholarships" },
          { label: "New" },
        ]}
        title="Add scholarship"
        description="Start with the title and the official deadline. Everything else can be filled in as the details are confirmed."
        actions={
          <Link
            href="/admin/scholarships"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </Link>
        }
      />

      <ScholarshipForm mode="create" reference={reference} />
    </>
  );
}
