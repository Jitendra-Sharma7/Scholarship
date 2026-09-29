"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

import {
  Pagination,
  TableToolbar,
  type Column,
} from "@/components/admin/ui/DataTable";
import { DataTable } from "@/components/admin/ui/DataTable";
import { Badge, EmptyState, Panel, type BadgeTone } from "@/components/admin/ui/primitives";
import {
  bulkSubmissionAction,
  convertSubmission,
  restoreSubmission,
  saveSubmissionNotes,
  setSubmissionStatus,
  trashSubmission,
  type SubmissionBulkAction,
} from "@/app/actions/submission-actions";
import {
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_TYPE_LABELS,
} from "@/lib/submissions/vocabulary";
import type { SubmissionRow } from "@/lib/admin-submissions";
import { cn } from "@/lib/utils";

/**
 * Review inbox for community submissions.
 *
 * A submission is an unverified claim, so the row leads with what was submitted
 * and its source, and the review actions are the point of the page rather than
 * an afterthought in a menu.
 */

const STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: "amber",
  UNDER_REVIEW: "blue",
  APPROVED: "green",
  REJECTED: "red",
};

const CONVERTIBLE = new Set(["SCHOLARSHIP", "UNIVERSITY", "COUNTRY", "FIELD", "RESOURCE"]);

export function SubmissionInbox({
  rows,
  total,
  page,
  perPage,
  trashed,
  canDelete,
  filters,
}: {
  rows: SubmissionRow[];
  total: number;
  page: number;
  perPage: number;
  trashed: boolean;
  canDelete: boolean;
  filters: { name: string; label: string; options: { value: string; label: string }[] }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(fn: () => Promise<{ error?: string } | undefined>, successMessage: string) {
    setBusyId(null);
    startTransition(async () => {
      try {
        const result = await fn();
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success(successMessage);
        setSelected([]);
        router.refresh();
      } catch {
        toast.error("That action could not be completed. Please try again.");
      }
    });
  }

  const bulkActions = trashed
    ? canDelete
      ? [{ id: "pending" as const, label: "Restore to pending" }]
      : []
    : [
        { id: "under_review" as const, label: "Mark as under review" },
        { id: "approved" as const, label: "Approve" },
        {
          id: "rejected" as const,
          label: "Reject",
          variant: "danger" as const,
          confirm: {
            title: "Reject these submissions?",
            body: "They stay on record as rejected so the decision is auditable.",
            confirmLabel: "Reject",
            destructive: true,
          },
        },
        ...(canDelete
          ? [
              {
                id: "trash" as const,
                label: "Move to trash",
                variant: "danger" as const,
                confirm: {
                  title: "Move to trash?",
                  body: "The submitter's details are removed from the inbox.",
                  confirmLabel: "Move to trash",
                  destructive: true,
                },
              },
            ]
          : []),
      ];

  const columns: Column<SubmissionRow>[] = [
    {
      key: "title",
      header: "Submission",
      cell: (row) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setOpenId(openId === row.id ? null : row.id)}
            aria-expanded={openId === row.id}
            className="block max-w-[28rem] truncate text-left font-medium text-slate-900 hover:text-blue-700 hover:underline"
          >
            {row.title}
          </button>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {SUBMISSION_TYPE_LABELS[row.type] ?? row.type}
            {row.submitterName ? ` · ${row.submitterName}` : ""}
            {row.submitterEmail ? ` · ${row.submitterEmail}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      hideBelow: "lg",
      cell: (row) =>
        row.officialUrl ? (
          <a
            href={row.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-[16rem] items-center gap-1 truncate text-xs text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{row.officialUrl}</span>
          </a>
        ) : (
          <span className="text-xs text-amber-700">No source given</span>
        ),
    },
    {
      key: "status",
      header: "State",
      cell: (row) => (
        <div className="flex flex-wrap items-center gap-1">
          {row.deletedAt ? (
            <Badge tone="red">trashed</Badge>
          ) : (
            <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
              {SUBMISSION_STATUS_LABELS[row.status] ?? row.status}
            </Badge>
          )}
          {row.convertedId ? <Badge tone="blue">converted</Badge> : null}
        </div>
      ),
    },
    {
      key: "received",
      header: "Received",
      hideBelow: "sm",
      cell: (row) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-slate-600">{row.createdAt}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-10",
      className: "w-10",
      cell: (row) => (
        <div className="relative flex justify-end">
          <button
            type="button"
            aria-label={`Actions for ${row.title}`}
            aria-haspopup="menu"
            aria-expanded={openId === row.id}
            onClick={() => setOpenId(openId === row.id ? null : row.id)}
            disabled={busyId === row.id}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            {busyId === row.id ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {!trashed ? (
        <TableToolbar
          searchPlaceholder="Search by submitter or internal note"
          filters={filters}
          extraFilters={
            <Link
              href="/admin/submissions?trashed=1"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Trash
            </Link>
          }
        />
      ) : (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
          Showing trashed submissions. Restoring a submission returns it to the pending queue.
        </p>
      )}

      {openId ? (
        <SubmissionDetail
          row={rows.find((r) => r.id === openId)}
          onClose={() => setOpenId(null)}
          onRun={run}
          canDelete={canDelete}
          trashed={trashed}
        />
      ) : null}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        sorts={[]}
        selectable={!trashed}
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={bulkActions}
        onBulk={(actionId, ids) =>
          run(
            () => bulkSubmissionAction(ids, actionId as SubmissionBulkAction),
            `Updated ${ids.length} submission${ids.length === 1 ? "" : "s"}`
          )
        }
        caption="Submissions"
        emptyState={
          <EmptyState
            title={trashed ? "Trash is empty" : "No submissions yet"}
            description={
              trashed
                ? "Nothing has been deleted from the inbox."
                : "Submissions sent from the site appear here for review."
            }
          />
        }
        renderCard={(row) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => setOpenId(openId === row.id ? null : row.id)}
                className="text-left text-sm font-medium text-slate-900 hover:text-blue-700 hover:underline"
              >
                {row.title}
              </button>
              <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
                {SUBMISSION_STATUS_LABELS[row.status] ?? row.status}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {SUBMISSION_TYPE_LABELS[row.type] ?? row.type} · {row.createdAt}
            </p>
            <button
              type="button"
              onClick={() => setOpenId(openId === row.id ? null : row.id)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              <Search className="h-3 w-3" aria-hidden="true" />
              Review
            </button>
          </div>
        )}
      />

      <Pagination
        page={page}
        total={total}
        perPage={perPage}
        totalLabel={(count) => `${count.toLocaleString("en-GB")} submissions`}
      />
    </div>
  );
}

type RunFn = (fn: () => Promise<{ error?: string } | undefined>, message: string) => void;

/** The expanded review panel: what was submitted, and what to do about it. */
function SubmissionDetail({
  row,
  onClose,
  onRun,
  canDelete,
  trashed,
}: {
  row: SubmissionRow | undefined;
  onClose: () => void;
  onRun: RunFn;
  canDelete: boolean;
  trashed: boolean;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(row?.internalNotes ?? "");
  const [countryCode, setCountryCode] = useState("");
  const [pending, startPending] = useTransition();

  if (!row) return null;

  const item =
    "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50";

  function convert() {
    startPending(async () => {
      const result = await convertSubmission(row!.id, countryCode || null);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Draft created from this submission. Review it before publishing.");
      onClose();
      router.refresh();
    });
  }

  return (
    <Panel className="mb-4" padded>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">{row.title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {SUBMISSION_TYPE_LABELS[row.type] ?? row.type} · submitted {row.createdAt} by{" "}
            {row.submitterName ?? "an anonymous submitter"}
            {row.submitterEmail ? ` (${row.submitterEmail})` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          Close
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            What was submitted
          </h3>
          {row.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {row.description}
            </p>
          ) : (
            <p className="text-sm text-slate-400">No description given.</p>
          )}

          <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Official source</dt>
              <dd className="mt-0.5">
                {row.officialUrl ? (
                  <a
                    href={row.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-blue-600 hover:underline"
                  >
                    {row.officialUrl}
                  </a>
                ) : (
                  <span className="text-amber-700">None given &mdash; verify before publishing</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Destination country</dt>
              <dd className="mt-0.5 text-slate-700">{row.countryName ?? "Not given"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Deadline</dt>
              <dd className="mt-0.5 text-slate-700">{row.deadline ?? "Not given"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Funding</dt>
              <dd className="mt-0.5 text-slate-700">
                {row.fundingAmount != null
                  ? `${row.currency ?? ""} ${row.fundingAmount.toLocaleString("en-GB")}`.trim()
                  : "Not given"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Degree levels</dt>
              <dd className="mt-0.5 text-slate-700">
                {row.degreeLevels.length > 0 ? row.degreeLevels.join(", ") : "Not given"}
              </dd>
            </div>
          </dl>

          {row.convertedId ? (
            <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
              Already converted into a {row.convertedType?.toLowerCase()}.{" "}
              <Link
                href={
                  row.convertedType === "Scholarship"
                    ? `/admin/scholarships/${row.convertedId}/edit`
                    : `/admin/${row.convertedType?.toLowerCase()}s/${row.convertedId}/edit`
                }
                className="font-medium underline"
              >
                Open the draft
              </Link>
              .
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Review decision
          </h3>

          <div className="flex flex-wrap gap-2">
            {trashed ? (
              canDelete ? (
                <button
                  type="button"
                  className={item}
                  onClick={() => onRun(() => restoreSubmission(row.id), "Submission restored")}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Restore
                </button>
              ) : null
            ) : (
              <>
                <button
                  type="button"
                  className={item}
                  onClick={() =>
                    onRun(
                      () => setSubmissionStatus(row.id, row.status === "UNDER_REVIEW" ? "PENDING" : "UNDER_REVIEW"),
                      row.status === "UNDER_REVIEW" ? "Moved back to pending" : "Marked as under review"
                    )
                  }
                >
                  Mark as under review
                </button>
                <button
                  type="button"
                  className={cn(item, "border-emerald-300 text-emerald-700 hover:bg-emerald-50")}
                  onClick={() => onRun(() => setSubmissionStatus(row.id, "APPROVED"), "Submission approved")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Approve
                </button>
                <button
                  type="button"
                  className={cn(item, "border-red-300 text-red-700 hover:bg-red-50")}
                  onClick={() => onRun(() => setSubmissionStatus(row.id, "REJECTED"), "Submission rejected")}
                >
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Reject
                </button>
                {canDelete ? (
                  <button
                    type="button"
                    className={cn(item, "border-red-300 text-red-700 hover:bg-red-50")}
                    onClick={() => onRun(() => trashSubmission(row.id), "Submission moved to trash")}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Move to trash
                  </button>
                ) : null}
              </>
            )}
          </div>

          {row.status === "APPROVED" && !row.convertedId && CONVERTIBLE.has(row.type) ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs leading-relaxed text-slate-600">
                Converting creates a <strong>draft</strong> with only what was submitted. It is not
                published, and verification still has to be completed in the editor.
              </p>
              {row.type === "COUNTRY" ? (
                <div className="mt-2.5">
                  <label
                    htmlFor="country-code"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    ISO alpha-2 code
                  </label>
                  <input
                    id="country-code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="GB"
                    maxLength={2}
                    className="mt-1 w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-sm uppercase outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Used in site URLs and filters, so it has to be correct.
                  </p>
                </div>
              ) : null}
              <button
                type="button"
                disabled={pending}
                onClick={convert}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : null}
                Create draft from submission
              </button>
            </div>
          ) : null}

          {row.status === "APPROVED" && !row.convertedId && !CONVERTIBLE.has(row.type) ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              A correction is applied to an existing record. Note what needs changing below, then
              close the submission.
            </p>
          ) : null}

          <div>
            <label htmlFor="internal-notes" className="block text-xs font-semibold text-slate-700">
              Internal notes
            </label>
            <p className="mb-1 text-[11px] text-slate-500">
              Visible to staff only. Never shown to the submitter.
            </p>
            <textarea
              id="internal-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => onRun(() => saveSubmissionNotes(row.id, notes), "Note saved")}
              className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Save note
            </button>
          </div>

          {row.reviewedAt ? (
            <p className="text-[11px] text-slate-500">
              Last reviewed {row.reviewedAt}
              {row.reviewerEmail ? ` by ${row.reviewerEmail}` : ""}
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
