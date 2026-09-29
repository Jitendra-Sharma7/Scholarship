"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ExternalLink,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  Star,
  Trash2,
  UserX,
  UserCheck,
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
  EmptyState,
  PublishBadge,
  type BadgeTone,
} from "@/components/admin/ui/primitives";
import {
  bulkEntityAction,
  deleteEntityForever,
  setEntityFeatured,
  setEntityPublishStatus,
  setUserSuspended,
  type BulkEntityAction,
} from "@/app/actions/admin-entity-actions";
import { humanizeEnum, type EntityDef } from "@/lib/admin-registry";
import { cn } from "@/lib/utils";

/**
 * Table for every registry-driven admin section.
 *
 * Columns come from the entity definition rather than a hand-written JSX tree,
 * so a new content type gets a complete, consistent list view - search, sort,
 * filters, row actions and bulk actions - without repeating any of it.
 */

export interface EntityRow extends Record<string, unknown> {
  id: string;
}

export interface EntityTableProps {
  entity: EntityDef;
  rows: EntityRow[];
  total: number;
  page: number;
  perPage: number;
  trashed: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isSuperAdmin: boolean;
  filters: FilterField[];
  /**
   * Public path a published record sits under, without the slug, e.g.
   * "/universities". Null for entities with no public page.
   */
  publicPrefix?: string;
  /**
   * Row keys composed into the second line under the title, in order.
   * Passed as data rather than a formatter function: a function cannot cross the
   * server/client boundary.
   */
  subtitleFields?: string[];
}

function cellTone(col: { tone?: Record<string, BadgeTone> }, raw: unknown): BadgeTone {
  const key = typeof raw === "boolean" ? String(raw) : String(raw ?? "");
  return col.tone?.[key] ?? "neutral";
}

function previewUrl(value: string): string {
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value;
  }
}

function fileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EntityTable({
  entity,
  rows,
  total,
  page,
  perPage,
  trashed,
  canEdit,
  canDelete,
  isSuperAdmin,
  filters,
  publicPrefix,
  subtitleFields = [],
}: EntityTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
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
        setOpenMenu(null);
        router.refresh();
      } catch {
        toast.error("That action could not be completed. Please try again.");
      }
    });
  }
  const isUserEntity = entity.model === "user";

  /**
   * The public URL of a published record, or null. Only published, untrashed
   * rows have one, so the row menu never offers a link that 404s.
   */
  function publicUrlFor(row: EntityRow): string | null {
    if (!publicPrefix) return null;
    const slug = row.slug;
    if (typeof slug !== "string" || slug === "") return null;
    if (row.deletedAt === true || row.publishStatus !== "PUBLISHED") return null;
    return `${publicPrefix}/${slug}`;
  }

  /** Second line under the title, assembled from the requested row keys. */
  function subtitleFor(row: EntityRow): string | null {
    const parts: string[] = [];
    for (const key of subtitleFields) {
      const value = row[key];
      if (typeof value === "string" && value !== "") parts.push(value);
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  }

  const bulkActions: BulkAction[] = useMemo(() => {
    if (trashed) {
      return canDelete
        ? [
            {
              id: "restore",
              label: "Restore from trash",
              confirm: {
                title: "Restore?",
                body: "The selected records become visible on the site again.",
                confirmLabel: "Restore",
              },
            },
          ]
        : [];
    }

    const actions: BulkAction[] = [];
    if (entity.hasPublish) {
      actions.push({ id: "publish", label: "Publish" });
      actions.push({
        id: "unpublish",
        label: "Move to draft",
        confirm: {
          title: "Move to draft?",
          body: "The selected records become hidden from the public site.",
          confirmLabel: "Move to draft",
        },
      });
      actions.push({
        id: "archive",
        label: "Archive",
        variant: "danger",
        confirm: {
          title: "Archive?",
          body: "Archived records stay hidden and are excluded from listings.",
          confirmLabel: "Archive",
          destructive: true,
        },
      });
    }
    if (entity.hasFeatured) {
      actions.push({ id: "feature", label: "Feature" });
      actions.push({ id: "unfeature", label: "Unfeature" });
    }
    // Users have no soft delete: an account cannot be trashed, only suspended.
    if (entity.hasTrash && canDelete) {
      actions.push({
        id: "trash",
        label: "Move to trash",
        variant: "danger",
        confirm: {
          title: "Move to trash?",
          body: "Trashed records are hidden from the site and can be restored.",
          confirmLabel: "Move to trash",
          destructive: true,
        },
      });
    }
    return actions;
  }, [trashed, canDelete, entity.hasPublish, entity.hasFeatured, entity.hasTrash]);

  function onBulk(actionId: string, ids: string[]) {
    run(
      () => bulkEntityAction(entity.key, ids, actionId as BulkEntityAction),
      `Updated ${ids.length} ${entity.label.toLowerCase().replace(/ies$/, "y").replace(/s$/, "")}`
    );
  }

  const sorts = entity.columns
    .filter((c) => c.sortable)
    .map((c) => ({ key: c.key, label: c.header }));
  const titleColumn = entity.columns.find((c) => c.kind === "title");

  const columns: Column<EntityRow>[] = entity.columns.map((col) => {
    if (col.key === "actions") {
      return {
        key: "actions",
        header: "",
        headerClassName: col.widthClass,
        className: col.widthClass,
        cell: (row) => (
          <div className="relative flex justify-end">
            <button
              type="button"
              aria-label={`Actions for ${rowTitle(row, titleColumn?.key)}`}
              aria-haspopup="menu"
              aria-expanded={openMenu === row.id}
              onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)}
              disabled={!canEdit}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              {busyId === row.id ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {openMenu === row.id ? (
              <RowMenu
                entity={entity}
                row={row}
                trashed={trashed}
                canDelete={canDelete}
                isSuperAdmin={isSuperAdmin}
                publicUrl={publicUrlFor(row)}
                onClose={() => setOpenMenu(null)}
                onBusy={() => setBusyId(row.id)}
                onRun={run}
              />
            ) : null}
          </div>
        ),
      };
    }

    const base = { key: col.key, header: col.header, sortable: col.sortable, hideBelow: col.hideBelow };
    // Read through a helper so each renderer pulls its own row's value.
    const cell = (r: EntityRow): unknown => r[col.key];

    switch (col.kind) {
      case "title":
        return {
          ...base,
          cell: (r) => {
            const sub = subtitleFor(r);
            return (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {r.featured === true ? (
                    <Star
                      className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
                      aria-label="Featured"
                    />
                  ) : null}
                  <Link
                    href={`/admin/${entity.key}/${r.id}/edit`}
                    className="truncate font-medium text-slate-900 hover:text-blue-700 hover:underline"
                  >
                    {rowTitle(r, col.key)}
                  </Link>
                </div>
                {sub ? <p className="mt-0.5 truncate text-xs text-slate-500">{sub}</p> : null}
              </div>
            );
          },
        };

      case "publish":
        return {
          ...base,
          cell: (r) =>
            r.deletedAt === true ? (
              <Badge tone="red">trashed</Badge>
            ) : (
              <PublishBadge status={String(r.publishStatus ?? "DRAFT")} />
            ),
        };

      case "boolean": {
        const render = (r: EntityRow) => {
          const raw = cell(r);
          return (
            <Badge tone={cellTone(col, raw)}>
              {raw === true ? "Yes" : raw === false ? "No" : "Unknown"}
            </Badge>
          );
        };
        return { ...base, cell: render };
      }

      case "badge":
        return {
          ...base,
          cell: (r) => {
            const raw = cell(r);
            if (raw == null || raw === "") {
              return <span className="text-xs text-slate-400">&mdash;</span>;
            }
            const text = String(raw);
            return (
              <Badge tone={cellTone(col, text)}>
                {col.key === "role" ? humanizeEnum(text) : text}
              </Badge>
            );
          },
        };

      case "number":
        return {
          ...base,
          cell: (r) => {
            const raw = cell(r);
            if (typeof raw !== "number") {
              return <span className="text-xs text-slate-400">&mdash;</span>;
            }
            return (
              <span className="tabular-nums">
                {col.key === "size" ? fileSize(raw) : raw.toLocaleString("en-GB")}
              </span>
            );
          },
        };

      case "date":
      case "datetime":
        return {
          ...base,
          cell: (r) => {
            const raw = cell(r);
            return raw ? (
              <span className="whitespace-nowrap text-xs tabular-nums text-slate-600">
                {String(raw)}
              </span>
            ) : (
              <span className="text-xs text-slate-400">&mdash;</span>
            );
          },
        };

      case "money":
        return {
          ...base,
          cell: (r) => {
            const raw = cell(r);
            return typeof raw === "number" ? (
              <span className="tabular-nums">${raw.toLocaleString("en-GB")}</span>
            ) : (
              <span className="text-xs text-slate-400">&mdash;</span>
            );
          },
        };

      case "image":
        return {
          ...base,
          cell: (r) => {
            const raw = cell(r);
            return raw ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={String(raw)}
                alt=""
                className="h-9 w-14 rounded-md border border-slate-200 bg-white object-contain"
              />
            ) : (
              <span className="text-xs text-slate-400">&mdash;</span>
            );
          },
        };

      default:
        return {
          ...base,
          cell: (r) => {
            const raw = cell(r);
            if (raw == null || raw === "") {
              return <span className="text-xs text-slate-400">&mdash;</span>;
            }
            return col.key === "url" ? (
              <a
                href={previewUrl(String(raw))}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-blue-600 hover:underline"
              >
                {previewUrl(String(raw))}
              </a>
            ) : (
              <span className="block max-w-[22rem] truncate">{String(raw)}</span>
            );
          },
        };
    }
  });

  return (
    <div>
      {!trashed ? (
        <TableToolbar
          searchPlaceholder={entity.searchPlaceholder}
          filters={filters}
          extraFilters={
            entity.hasTrash ? (
              <Link
                href={`/admin/${entity.key}?trashed=1`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Trash
              </Link>
            ) : null
          }
        />
      ) : (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
          Showing trashed {entity.label.toLowerCase()}. These records are hidden from the site until
          they are restored.
        </p>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        sorts={sorts}
        defaultSort={entity.defaultSort}
        selectable={canEdit && (!trashed || canDelete)}
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={bulkActions}
        onBulk={onBulk}
        caption={entity.label}
        emptyState={
          <EmptyState
            title={
              trashed
                ? `Trash is empty`
                : rows.length === 0 && total === 0
                  ? `No ${entity.label.toLowerCase()} yet`
                  : `No ${entity.label.toLowerCase()} match these filters`
            }
            description={
              trashed
                ? `Nothing has been deleted from ${entity.label.toLowerCase()}.`
                : undefined
            }
          />
        }
        renderCard={(row) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/admin/${entity.key}/${row.id}/edit`}
                className="text-sm font-medium text-slate-900 hover:text-blue-700 hover:underline"
              >
                {rowTitle(row, titleColumn?.key)}
              </Link>
              {entity.hasPublish ? (
                row.deletedAt === true ? (
                  <Badge tone="red">trashed</Badge>
                ) : (
                  <PublishBadge status={String(row.publishStatus ?? "DRAFT")} />
                )
              ) : null}
            </div>
            {subtitleFor(row) ? (
              <p className="mt-0.5 text-xs text-slate-500">{subtitleFor(row)}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {row.featured === true ? <Badge tone="amber">featured</Badge> : null}
              {isUserEntity ? (
                <Badge tone={row.suspended === true ? "red" : "green"}>
                  {row.suspended === true ? "suspended" : "active"}
                </Badge>
              ) : null}
              {row.scholarshipCount ? (
                <span className="text-xs text-slate-500">
                  {Number(row.scholarshipCount)} scholarship
                  {Number(row.scholarshipCount) === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </div>
        )}
      />

      <Pagination
        page={page}
        total={total}
        perPage={perPage}
        totalLabel={(count) => `${count.toLocaleString("en-GB")} ${entity.label.toLowerCase()}`}
      />
    </div>
  );
}

function rowTitle(row: EntityRow, key?: string): string {
  const value = row[key ?? "title"] ?? row.title ?? row.name ?? row.originalName ?? row.email;
  return typeof value === "string" && value.length > 0 ? value : "Untitled";
}

type RunFn = (fn: () => Promise<{ error?: string } | undefined>, message: string) => void;

/** Per-row menu, rendered inline so it needs no extra data fetching. */
function RowMenu({
  entity,
  row,
  trashed,
  canDelete,
  isSuperAdmin,
  publicUrl,
  onClose,
  onBusy,
  onRun,
}: {
  entity: EntityDef;
  row: EntityRow;
  trashed: boolean;
  canDelete: boolean;
  isSuperAdmin: boolean;
  publicUrl: string | null;
  onClose: () => void;
  onBusy: () => void;
  onRun: RunFn;
}) {
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const label = rowTitle(row);
  const published = row.publishStatus === "PUBLISHED";

  const item =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50";

  /**
   * Marks the row busy, then hands the call to the table's `run`, which owns the
   * toast, the refresh and the selection reset.
   */
  function exec(fn: () => Promise<{ error?: string } | undefined>, message: string) {
    setPending(true);
    onBusy();
    onRun(fn, message);
  }

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden="true" />
      <div
        role="menu"
        className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
      >
        <Link
          href={`/admin/${entity.key}/${row.id}/edit`}
          role="menuitem"
          className={item}
          onClick={onClose}
        >
          Edit
        </Link>

        {publicUrl ? (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            className={item}
            onClick={onClose}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            View on site
          </a>
        ) : null}

        {trashed ? (
          canDelete ? (
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              className={item}
              onClick={() =>
                exec(
                  () => bulkEntityAction(entity.key, [row.id], "restore"),
                  `Restored "${label}"`
                )
              }
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Restore
            </button>
          ) : null
        ) : entity.model === "user" ? (
          canDelete ? (
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              className={item}
              onClick={() =>
                exec(
                  () => setUserSuspended(row.id, row.suspended !== true),
                  row.suspended === true ? "Access restored" : "Account suspended"
                )
              }
            >
              {row.suspended === true ? (
                <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <UserX className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {row.suspended === true ? "Restore access" : "Suspend account"}
            </button>
          ) : null
        ) : (
          <>
            {entity.hasPublish ? (
              <button
                type="button"
                role="menuitem"
                disabled={pending}
                className={item}
                onClick={() =>
                  exec(
                    () =>
                      setEntityPublishStatus(
                        entity.key,
                        row.id,
                        published ? "DRAFT" : "PUBLISHED"
                      ),
                    published ? "Moved to draft" : "Published"
                  )
                }
              >
                {published ? "Unpublish" : "Publish"}
              </button>
            ) : null}

            {entity.hasFeatured ? (
              <button
                type="button"
                role="menuitem"
                disabled={pending}
                className={item}
                onClick={() =>
                  exec(
                    () => setEntityFeatured(entity.key, row.id, row.featured !== true),
                    row.featured === true ? "Removed from featured" : "Marked as featured"
                  )
                }
              >
                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                {row.featured === true ? "Unfeature" : "Feature"}
              </button>
            ) : null}

            {entity.hasTrash && canDelete ? (
              <button
                type="button"
                role="menuitem"
                disabled={pending}
                className={cn(item, "text-red-600 hover:bg-red-50")}
                onClick={() =>
                  exec(
                    () => bulkEntityAction(entity.key, [row.id], "trash"),
                    "Moved to trash"
                  )
                }
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Move to trash
              </button>
            ) : null}
          </>
        )}

        {trashed && isSuperAdmin ? (
          confirmDelete ? (
            <div className="border-t border-slate-100 p-2">
              <p className="mb-2 text-[11px] leading-snug text-slate-600">
                Permanently delete &ldquo;{label}&rdquo;? This cannot be undone.
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setConfirmDelete(false);
                    exec(() => deleteEntityForever(entity.key, row.id, true), "Deleted permanently");
                  }}
                  className="flex-1 rounded-lg bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Delete forever
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              role="menuitem"
              className={cn(item, "text-red-700 hover:bg-red-50")}
              onClick={() => setConfirmDelete(true)}
            >
              Delete permanently
            </button>
          )
        ) : null}
      </div>
    </>
  );
}
