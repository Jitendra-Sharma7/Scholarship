import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { requireStaff, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEditorReferenceData } from "@/lib/admin-scholarships";
import { ScholarshipForm } from "@/components/admin/scholarships/ScholarshipForm";
import { PageHeader, PublishBadge, DeadlineBadge } from "@/components/admin/ui/primitives";
import { fromPrismaDeadlineStatus } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Edit scholarship" };

export default async function EditScholarshipPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { saved } = await searchParams;

  const [scholarship, reference, user] = await Promise.all([
    prisma.scholarship.findUnique({
      where: { id },
      include: { fields: { select: { fieldId: true } } },
    }),
    getEditorReferenceData(),
    getCurrentUser(),
  ]);

  // A trashed record is still editable from the trash view, so it is not
  // treated as missing here.
  if (!scholarship) notFound();

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Scholarships", href: "/admin/scholarships" },
          { label: "Edit" },
        ]}
        title={scholarship.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <PublishBadge status={scholarship.publishStatus} />
            <DeadlineBadge status={fromPrismaDeadlineStatus(scholarship.deadlineStatus)} />
            {scholarship.deletedAt ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                in trash
              </span>
            ) : null}
            {scholarship.deadline ? (
              <span className="text-xs text-slate-500">
                Deadline {formatDate(scholarship.deadline)}
              </span>
            ) : null}
          </span>
        }
        actions={
          <>
            <Link
              href="/admin/scholarships"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to list
            </Link>
            {scholarship.publishStatus === "PUBLISHED" && !scholarship.deletedAt ? (
              <a
                href={`/scholarships/${scholarship.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                View on site
              </a>
            ) : null}
          </>
        }
      />

      {saved === "1" ? (
        <p
          role="status"
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800"
        >
          Scholarship saved.
        </p>
      ) : null}

      <ScholarshipForm
        mode="edit"
        scholarship={scholarship}
        fieldIds={scholarship.fields.map((f) => f.fieldId)}
        reference={reference}
        canDelete={user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"}
      />
    </>
  );
}
