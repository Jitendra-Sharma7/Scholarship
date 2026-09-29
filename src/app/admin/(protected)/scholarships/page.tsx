import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/admin/ui/primitives";
import { atLeast, getCurrentUser, isStaff, requireStaff } from "@/lib/auth";
import {
  listScholarships,
  getScholarshipFilterOptions,
  type ScholarshipListFilters,
} from "@/lib/admin-scholarships";
import { ScholarshipTable } from "@/components/admin/scholarships/ScholarshipTable";
import {
  FUNDING_TYPE_LABELS,
  fromPrismaDeadlineStatus,
  fromPrismaFundingType,
  fromPrismaVerificationStatus,
} from "@/lib/enums";

export const metadata = { title: "Scholarships" };

/** Parses the query string into typed filters, ignoring anything unrecognised. */
function parseFilters(params: Record<string, string | string[] | undefined>): ScholarshipListFilters {
  const one = (key: string) => {
    const v = params[key];
    return typeof v === "string" && v !== "" ? v : undefined;
  };
  const yesNo = (key: string) => {
    const v = one(key);
    return v === "yes" || v === "no" ? v : undefined;
  };
  const dir = one("dir") === "asc" ? "asc" : "desc";
  const pageRaw = Number(one("page") ?? "1");

  return {
    q: one("q"),
    status: one("status"),
    deadline: one("deadline"),
    fundingType: one("fundingType"),
    countryId: one("countryId"),
    fieldId: one("fieldId"),
    verification: one("verification"),
    featured: yesNo("featured"),
    fullyFunded: yesNo("fullyFunded"),
    trashed: one("trashed") === "1",
    sort: one("sort"),
    dir,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  };
}

export default async function AdminScholarshipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const user = await getCurrentUser();
  const filters = parseFilters(await searchParams);
  const canEdit = isStaff(user?.role) && (atLeast(user?.role, "EDITOR") ?? false);

  const [{ rows, total, page, perPage }, options] = await Promise.all([
    listScholarships(filters),
    getScholarshipFilterOptions(),
  ]);

  return (
    <>
      <PageHeader
        title={filters.trashed ? "Trash" : "Scholarships"}
        description={
          filters.trashed
            ? "Trashed scholarships are hidden from the public site. Restore or delete them permanently."
            : `${total.toLocaleString()} scholarship${total === 1 ? "" : "s"}. Deadline status is calculated automatically from the application date.`
        }
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Scholarships" }]}
        actions={
          canEdit ? (
            <Link
              href="/admin/scholarships/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add scholarship
            </Link>
          ) : null
        }
      />

      <ScholarshipTable
        rows={rows}
        total={total}
        page={page}
        perPage={perPage}
        trashed={filters.trashed ?? false}
        canEdit={canEdit}
        canDelete={atLeast(user?.role, "ADMIN") ?? false}
        filters={[
          {
            name: "status",
            label: "Publish status",
            options: [
              { value: "PUBLISHED", label: "Published" },
              { value: "DRAFT", label: "Draft" },
              { value: "ARCHIVED", label: "Archived" },
            ],
          },
          {
            // Values are the Prisma enum names the `where` clause needs; the
            // labels are the display strings the site shows.
            name: "deadline",
            label: "Deadline status",
            options: options.deadlineStatuses.map((d) => ({
              value: d.deadlineStatus,
              label: `${fromPrismaDeadlineStatus(d.deadlineStatus)} (${d._count})`,
            })),
          },
          {
            name: "fundingType",
            label: "Funding",
            options: options.fundingTypes.map((f) => ({
              value: f.fundingType,
              label: `${FUNDING_TYPE_LABELS[fromPrismaFundingType(f.fundingType)]} (${f._count})`,
            })),
          },
          {
            name: "countryId",
            label: "Country",
            options: options.countries.map((c) => ({ value: c.id, label: c.name })),
          },
          {
            name: "verification",
            label: "Verification",
            options: options.verification.map((v) => ({
              value: v.verificationStatus,
              label: `${fromPrismaVerificationStatus(v.verificationStatus)} (${v._count})`,
            })),
          },
          {
            name: "featured",
            label: "Featured",
            options: [
              { value: "yes", label: "Featured" },
              { value: "no", label: "Not featured" },
            ],
          },
          {
            name: "fullyFunded",
            label: "Fully funded",
            options: [
              { value: "yes", label: "Fully funded" },
              { value: "no", label: "Not fully funded" },
            ],
          },
        ]}
      />

      {!filters.trashed && rows.length === 0 && !filters.q ? (
        <p className="mt-4 text-center text-xs text-slate-400">
          No scholarships yet.{" "}
          <Link href="/admin/scholarships/new" className="font-medium text-blue-600 hover:underline">
            Add the first one
          </Link>
          .
        </p>
      ) : null}
    </>
  );
}
