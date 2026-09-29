import { PageHeader, StatCard } from "@/components/admin/ui/primitives";
import { atLeast, getCurrentUser, requireStaff } from "@/lib/auth";
import { listSubmissions, submissionCounts } from "@/lib/admin-submissions";
import { SubmissionInbox } from "@/components/admin/submissions/SubmissionInbox";
import { SUBMISSION_STATUS_LABELS, SUBMISSION_TYPE_LABELS } from "@/lib/submissions/vocabulary";

/**
 * Community submission inbox.
 *
 * Deliberately a review queue rather than a content table: the useful question
 * here is "what is waiting on a decision", not "what is published".
 */

export const metadata = { title: "Submissions" };

function parseFilters(params: Record<string, string | string[] | undefined>) {
  const one = (key: string) => {
    const v = params[key];
    return typeof v === "string" && v !== "" ? v : undefined;
  };
  const pageRaw = Number(one("page") ?? "1");

  return {
    q: one("q"),
    status: one("status") ?? "ALL",
    type: one("type") ?? "ALL",
    trashed: one("trashed") === "1",
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  };
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const user = await getCurrentUser();
  const canDelete = atLeast(user?.role, "ADMIN");

  const filters = parseFilters(await searchParams);
  const [{ rows, total, page, perPage }, counts] = await Promise.all([
    listSubmissions(filters),
    submissionCounts(),
  ]);

  const awaiting = counts.PENDING + counts.UNDER_REVIEW;

  return (
    <>
      <PageHeader
        title="Submissions"
        description={
          awaiting > 0
            ? `${awaiting.toLocaleString("en-GB")} submission${awaiting === 1 ? "" : "s"} awaiting a decision. Nothing here is published without an admin completing the record.`
            : "Nothing is waiting for review. Submissions sent from the site land here."
        }
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Submissions" }]}
      />

      {!filters.trashed ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Pending"
            value={counts.PENDING}
            tone={counts.PENDING > 0 ? "amber" : "neutral"}
            hint="Not yet looked at"
            href="/admin/submissions?status=PENDING"
          />
          <StatCard
            label="Under review"
            value={counts.UNDER_REVIEW}
            tone={counts.UNDER_REVIEW > 0 ? "blue" : "neutral"}
            href="/admin/submissions?status=UNDER_REVIEW"
          />
          <StatCard
            label="Approved"
            value={counts.APPROVED}
            tone="green"
            href="/admin/submissions?status=APPROVED"
          />
          <StatCard
            label="Rejected"
            value={counts.REJECTED}
            tone={counts.REJECTED > 0 ? "red" : "neutral"}
            href="/admin/submissions?status=REJECTED"
          />
        </div>
      ) : null}

      <SubmissionInbox
        rows={rows}
        total={total}
        page={page}
        perPage={perPage}
        trashed={filters.trashed ?? false}
        canDelete={canDelete}
        filters={[
          {
            name: "status",
            label: "Decision",
            options: (Object.keys(SUBMISSION_STATUS_LABELS) as (keyof typeof SUBMISSION_STATUS_LABELS)[]).map(
              (s) => ({ value: s, label: `${SUBMISSION_STATUS_LABELS[s]} (${counts[s] ?? 0})` })
            ),
          },
          {
            name: "type",
            label: "Type",
            options: (Object.keys(SUBMISSION_TYPE_LABELS) as (keyof typeof SUBMISSION_TYPE_LABELS)[]).map(
              (t) => ({ value: t, label: SUBMISSION_TYPE_LABELS[t] })
            ),
          },
        ]}
      />

      {rows.length > 0 && !filters.trashed ? (
        <p className="mt-4 text-xs text-slate-500">
          A submission is a claim from a member of the public. Approving one records your decision;
          it does not publish anything &mdash; converting a submission creates a draft that still has
          to be verified and published in the editor.
        </p>
      ) : null}
    </>
  );
}
