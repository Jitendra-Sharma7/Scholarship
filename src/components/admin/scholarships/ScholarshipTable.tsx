"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  ExternalLink,
  RotateCcw,
  Star,
  Trash2,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "react-hot-toast";

import {
  DataTable,
  Pagination,
  TableToolbar,
  type BulkAction,
  type Column,
  type FilterField,
} from "@/components/admin/ui/DataTable";
import {
  Badge,
  DeadlineBadge,
  EmptyState,
  PublishBadge,
  type BadgeTone,
} from "@/components/admin/ui/primitives";
import {
  bulkScholarshipAction,
  duplicateScholarship,
  restoreScholarship,
  setScholarshipFlags,
  setScholarshipStatus,
  trashScholarship,
  type BulkScholarshipAction,
} from "@/app/actions/scholarship-actions";
import type { ScholarshipListRow } from "@/lib/admin-scholarships";
import { fromPrismaDeadlineStatus, fromPrismaFundingType } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

const SORTS = [
  { key: "title", label: "Title" },
  { key: "deadline", label: "Deadline" },
  { key: "deadlineStatus", label: "Status" },
  { key: "publishStatus", label: "Published" },
  { key: "country", label: "Country" },
  { key: "createdAt", label: "Created" },
  { key: "updatedAt", label: "Updated" },
];

/** Tones keyed by the Prisma enum name, not the display string. */
const FUNDING_TONE: Record<string, BadgeTone> = {
  FULLY_FUNDED: "green",
  FULLY_TUITION: "green",
  PARTIAL_TUITION: "amber",
  STIPEND: "blue",
  MIXED: "purple",
};

const VERIFICATION_TONE: Record<string, BadgeTone> = {
  VERIFIED_RECENTLY: "green",
  VERIFICATION_NEEDED: "red",
  POTENTIALLY_EXPIRED: "amber",
};

const BULK: { action: BulkScholarshipAction; label: string; variant?: "danger" }[] = [
  { action: "publish", label: "Publish" },
  { action: "unpublish", label: "Move to draft" },
  { action: "archive", label: "Archive", variant: "danger" },
  { action: "feature", label: "Feature" },
  { action: "unfeature", label: "Unfeature" },
  { action: "fullyFunded", label: "Mark fully funded" },
  { action: "notFullyFunded", label: "Clear fully funded" },
];

export function ScholarshipTable({
  rows,
  total,
  page,
  perPage,
  trashed,
  canEdit,
  canDelete,
  filters,
}: {
  rows: ScholarshipListRow[];
  total: number;
  page: number;
  perPage: number;
  trashed: boolean;
  canEdit: boolean;
  canDelete: boolean;
  filters: FilterField[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  /** Runs an action, surfaces failures as a toast, and refreshes the table. */
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

  const bulkActions: BulkAction[] = trashed
    ? []
    : [
        ...BULK.map((b) => ({
          id: b.action,
          label: b.label,
          variant: b.variant,
          confirm:
            b.action === "publish" || b.action === "feature"
              ? undefined
              : {
                  title: `${b.label}?`,
                  body: `This will apply to ${selected.length || "the selected"} scholarship${
                    (selected.length || 1) === 1 ? "" : "s"
                  }.`,
                  confirmLabel: b.label,
                  destructive: b.variant === "danger",
                },
        })),
        {
          id: "trash",
          label: "Move to trash",
          variant: "danger" as const,
          confirm: {
            title: "Move to trash?",
            body: "Trashed scholarships are hidden from the public site and can be restored.",
            confirmLabel: "Move to trash",
            destructive: true,
          },
        },
      ];

  function onBulk(actionId: string, ids: string[]) {
    run(
      () => bulkScholarshipAction(ids, actionId as BulkScholarshipAction),
      `Updated ${ids.length} scholarship${ids.length === 1 ? "" : "s"}`
    );
  }

  const columns: Column<ScholarshipListRow>[] = [
    {
      key: "title",
      header: "Scholarship",
      sortable: true,
      cell: (row) => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {row.featured ? (
              <Star
                className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
                aria-label="Featured"
              />
            ) : null}
            <Link
              href={`/admin/scholarships/${row.id}/edit`}
              className="truncate font-medium text-slate-900 hover:text-blue-700 hover:underline"
            >
              {row.title}
            </Link>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {[row.universityName, row.countryName].filter(Boolean).join(" · ") || "No location set"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "State",
      hideBelow: "md",
      cell: (row) => (
        <div className="flex flex-wrap items-center gap-1">
          {trashed ? (
            <Badge tone="red">trashed</Badge>
          ) : (
            <PublishBadge status={row.publishStatus} />
          )}
          <DeadlineBadge status={fromPrismaDeadlineStatus(row.deadlineStatus)} />
        </div>
      ),
    },
    {
      key: "fundingType",
      header: "Funding",
      hideBelow: "lg",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={FUNDING_TONE[row.fundingType] ?? "neutral"}>
            {fromPrismaFundingType(row.fundingType)}
          </Badge>
          {row.isFullyFunded ? <Badge tone="green">fully funded</Badge> : null}
        </div>
      ),
    },
    {
      key: "deadline",
      header: "Deadline",
      sortable: true,
      hideBelow: "sm",
      cell: (row) =>
        row.deadline ? (
          <span className="whitespace-nowrap text-xs tabular-nums text-slate-600">
            {formatDate(row.deadline)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Not set</span>
        ),
    },
    {
      key: "verification",
      header: "Verified",
      hideBelow: "lg",
      cell: (row) => (
        <Badge tone={VERIFICATION_TONE[row.verificationStatus] ?? "neutral"}>
          {row.verificationStatus.replace(/_/g, " ").toLowerCase()}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-10",
      cell: (row) => (
        <div className="relative flex justify-end">
          <button
            type="button"
            aria-label={`Actions for ${row.title}`}
            aria-haspopup="menu"
            aria-expanded={openMenu === row.id}
            onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)}
            disabled={!canEdit || pending}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            {busyId === row.id ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {openMenu === row.id ? (
            <RowMenu
              row={row}
              trashed={trashed}
              canDelete={canDelete}
              onClose={() => setOpenMenu(null)}
              onBusy={() => setBusyId(row.id)}
              onDone={() => {
                setOpenMenu(null);
                setSelected([]);
                router.refresh();
              }}
            />
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      {!trashed ? (
        <TableToolbar
          searchPlaceholder="Search by title, slug, university or country"
          filters={filters}
          extraFilters={
            <Link
              href="/admin/trash"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Trash
            </Link>
          }
        />
      ) : null}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        sorts={SORTS}
        defaultSort={{ key: "updatedAt", dir: "desc" }}
        selectable={canEdit && !trashed}
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={bulkActions}
        onBulk={onBulk}
        caption="Scholarships"
        emptyState={
          <EmptyState
            title="No scholarships match these filters"
            description="Try clearing the search or filters to see more results."
            action={
              <button
                type="button"
                onClick={() => router.push("/admin/scholarships")}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear all filters
              </button>
            }
          />
        }
        renderCard={(row) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/admin/scholarships/${row.id}/edit`}
                className="text-sm font-medium text-slate-900 hover:text-blue-700 hover:underline"
              >
                {row.title}
              </Link>
              <PublishBadge status={row.publishStatus} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {[row.universityName, row.countryName].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <DeadlineBadge status={row.deadlineStatus} />
              {row.featured ? <Badge tone="amber">featured</Badge> : null}
            </div>
            {row.deadline ? (
              <p className="mt-1.5 text-xs text-slate-500">
                Deadline {formatDate(row.deadline)}
              </p>
            ) : null}
          </div>
        )}
      />

      <Pagination
        page={page}
        total={total}
        perPage={perPage}
        totalLabel={(count) => `${count.toLocaleString()} scholarship${count === 1 ? "" : "s"}`}
      />
    </div>
  );
}

/** Per-row action menu. Rendered inline so it inherits the table's data. */
function RowMenu({
  row,
  trashed,
  canDelete,
  onClose,
  onBusy,
  onDone,
}: {
  row: ScholarshipListRow;
  trashed: boolean;
  canDelete: boolean;
  onClose: () => void;
  onBusy: () => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function exec(
    fn: () => Promise<{ error?: string; newId?: string } | undefined>,
    message: string
  ) {
    onBusy();
    startTransition(async () => {
      try {
        const result = await fn();
        if (result?.error) {
          toast.error(result.error);
          onClose();
          return;
        }
        toast.success(message);
        onDone();
        if (result && "newId" in result && result.newId) {
          router.push(`/admin/scholarships/${result.newId}/edit`);
        }
      } catch {
        toast.error("That action could not be completed. Please try again.");
        onClose();
      }
    });
  }

  const itemClass =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50";

  return (
    <>
      {/* Click-away layer. */}
      <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden="true" />
      <div
        role="menu"
        className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
      >
        <Link
          href={`/admin/scholarships/${row.id}/edit`}
          role="menuitem"
          className={itemClass}
          onClick={onClose}
        >
          Edit
        </Link>

        {row.publishStatus === "PUBLISHED" && !trashed ? (
          <a
            href={`/scholarships/${row.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className={itemClass}
            onClick={onClose}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            View on site
          </a>
        ) : null}

        <button
          type="button"
          role="menuitem"
          disabled={pending}
          className={itemClass}
          onClick={() =>
            exec(
              () => duplicateScholarship(row.id),
              "Duplicated. The copy is saved as a draft."
            )
          }
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Duplicate
        </button>

        {trashed ? (
          <button
            type="button"
            role="menuitem"
            disabled={pending || !canDelete}
            className={itemClass}
            onClick={() => exec(() => restoreScholarship(row.id), "Restored from trash")}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Restore
          </button>
        ) : (
          <>
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              className={itemClass}
              onClick={() =>
                exec(
                  () =>
                    setScholarshipStatus(
                      row.id,
                      row.publishStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
                    ),
                  row.publishStatus === "PUBLISHED" ? "Moved to draft" : "Published"
                )
              }
            >
              {row.publishStatus === "PUBLISHED" ? "Unpublish" : "Publish"}
            </button>

            <button
              type="button"
              role="menuitem"
              disabled={pending}
              className={itemClass}
              onClick={() =>
                exec(
                  () => setScholarshipFlags(row.id, { featured: !row.featured }),
                  row.featured ? "Removed from featured" : "Marked as featured"
                )
              }
            >
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
              {row.featured ? "Unfeature" : "Feature"}
            </button>

            {canDelete ? (
              <button
                type="button"
                role="menuitem"
                disabled={pending}
                className={`${itemClass} text-red-600 hover:bg-red-50`}
                onClick={() =>
                  exec(() => trashScholarship(row.id), "Moved to trash")
                }
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Move to trash
              </button>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
