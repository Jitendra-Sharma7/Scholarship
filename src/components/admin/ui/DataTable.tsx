"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { PER_PAGE } from "@/lib/admin-pagination";

/**
 * URL-backed table state: search, sort, filters and page all live in the query
 * string.
 *
 * That makes every view shareable and bookmarkable, survives a refresh, and
 * lets the server component do the filtering and pagination - the browser never
 * receives more rows than the page it is showing.
 */

export interface SortState {
  key: string;
  dir: "asc" | "desc";
}

export interface FilterField {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface BulkAction {
  id: string;
  label: string;
  /** Omit the confirm dialog for safe, reversible actions. */
  confirm?: { title: string; body: string; confirmLabel: string; destructive?: boolean };
  variant?: "default" | "danger";
}

interface DataTableControlsProps {
  searchPlaceholder: string;
  filters?: FilterField[];
  sorts: { key: string; label: string }[];
  defaultSort?: SortState;
  showBulk?: boolean;
  bulkActions?: BulkAction[];
  /** Fired with the selected ids when a bulk action runs. */
  onBulk?: (actionId: string, ids: string[]) => void;
  extraFilters?: React.ReactNode;
  totalLabel?: (count: number) => string;
  selectedCount?: number;
}

export function useTableState(defaultSort?: SortState) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const query = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const sort = (params.get("sort") as string | null) ?? defaultSort?.key ?? "";
  const dir = (params.get("dir") as "asc" | "desc" | null) ?? defaultSort?.dir ?? "desc";

  const setParams = useCallback(
    (mutate: (sp: URLSearchParams) => void, opts?: { keepPage?: boolean }) => {
      const sp = new URLSearchParams(params.toString());
      mutate(sp);
      // Changing a filter or the search term must return to page 1, otherwise a
      // narrowed result set can leave the viewer on a page that no longer
      // exists. Explicit page changes opt out via keepPage.
      if (!opts?.keepPage) sp.set("page", "1");
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  const setParam = useCallback(
    (name: string, value: string | null) => {
      setParams((sp) => {
        if (value === null || value === "") sp.delete(name);
        else sp.set(name, value);
      });
    },
    [setParams]
  );

  const setPage = useCallback(
    (page: number) => {
      setParams((sp) => sp.set("page", String(page)), { keepPage: true });
    },
    [setParams]
  );

  const toggleSort = useCallback(
    (key: string) => {
      setParams((sp) => {
        if (sp.get("sort") === key) {
          sp.set("dir", sp.get("dir") === "asc" ? "desc" : "asc");
        } else {
          sp.set("sort", key);
          sp.set("dir", "asc");
        }
      });
    },
    [setParams]
  );

  return { query, page, sort, dir, setParam, setPage, toggleSort, params, router, pathname };
}

// --- Search + filter bar --------------------------------------------------

export function TableToolbar({
  searchPlaceholder,
  filters = [],
  extraFilters,
}: Pick<DataTableControlsProps, "searchPlaceholder" | "filters" | "extraFilters">) {
  const { query, params, setParam } = useTableState();
  const [term, setTerm] = useState(query);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // The search box mirrors the `?q=` URL parameter, which can also change from
  // elsewhere (the Clear button, a back navigation). Adjusting during render is
  // the supported way to resync: an effect would set state after commit and
  // show one frame of the stale term.
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setTerm(query);
  }

  const activeFilterCount = filters.filter((f) => params.get(f.name)).length;

  useEffect(() => {
    if (term === query) return;
    const timer = setTimeout(() => setParam("q", term || null), 350);
    return () => clearTimeout(timer);
  }, [term, query, setParam]);

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <label htmlFor="table-search" className="sr-only">
            {searchPlaceholder}
          </label>
          <input
            id="table-search"
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {filters.length > 0 ? (
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              filtersOpen || activeFilterCount > 0
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        ) : null}

        {extraFilters}

        {activeFilterCount > 0 || query ? (
          <button
            type="button"
            onClick={() => {
              setTerm("");
              for (const f of filters) setParam(f.name, null);
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </button>
        ) : null}
      </div>

      {filtersOpen && filters.length > 0 ? (
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
          {filters.map((field) => {
            const value = params.get(field.name) ?? "";
            return (
              <div key={field.name}>
                <label
                  htmlFor={`filter-${field.name}`}
                  className="mb-1 block text-xs font-medium text-slate-600"
                >
                  {field.label}
                </label>
                <select
                  id={`filter-${field.name}`}
                  value={value}
                  onChange={(e) => setParam(field.name, e.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// --- Table ----------------------------------------------------------------

export interface Column<T> {
  key: string;
  header: string;
  /** Rendered cell. Receives the row and the table's toggle-sort handler. */
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  /** Applied to both the th and td for consistent alignment. */
  className?: string;
  headerClassName?: string;
  /** Hide on small screens to keep the mobile table readable. */
  hideBelow?: "sm" | "md" | "lg";
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  sorts: { key: string; label: string }[];
  defaultSort?: SortState;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Action menu shown once at least one row is selected. */
  bulkActions?: BulkAction[];
  onBulk?: (actionId: string, ids: string[]) => void;
  emptyState?: React.ReactNode;
  /** Mobile-only card renderer. Falls back to a scrollable table. */
  renderCard?: (row: T) => React.ReactNode;
  caption?: string;
}

const HIDE_CLASS = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  sorts,
  defaultSort,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions = [],
  onBulk,
  emptyState,
  renderCard,
  caption,
}: DataTableProps<T>) {
  const { sort, dir, toggleSort } = useTableState(defaultSort);
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  /** Set when a destructive action needs explicit confirmation. */
  const [confirming, setConfirming] = useState<BulkAction | null>(null);

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(rowKey(r)));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const pageIds = useMemo(() => rows.map(rowKey), [rows, rowKey]);

  function toggleAll() {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : pageIds);
  }

  function toggleOne(id: string) {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]
    );
  }

  function invokeBulk(action: BulkAction) {
    if (!onBulk) return;
    setMenuOpen(false);
    if (action.confirm) {
      setConfirming(action);
      return;
    }
    startTransition(() => onBulk(action.id, selectedIds));
  }

  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Mobile: cards, because a 7-column table is unusable on a phone. */}
      {renderCard && rows.length > 0 ? (
        <ul className="space-y-2.5 lg:hidden">
          {rows.map((row) => (
            <li
              key={rowKey(row)}
              className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
            >
              {selectable && onSelectionChange ? (
                <label className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(rowKey(row))}
                    onChange={() => toggleOne(rowKey(row))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Select
                </label>
              ) : null}
              {renderCard(row)}
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
          renderCard && "hidden lg:block"
        )}
      >
        {selectable && onSelectionChange ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-slate-300"
              />
              {allSelected ? "Deselect all" : "Select all on page"}
            </label>
            {selectedIds.length > 0 ? (
              <>
                <span className="text-xs text-slate-500" aria-live="polite">
                  {selectedIds.length} selected
                </span>
                {bulkActions.length > 0 && onBulk ? (
                  <div className="relative ml-auto">
                    <button
                      type="button"
                      onClick={() => setMenuOpen((v) => !v)}
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                    >
                      Bulk actions
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>

                    {menuOpen ? (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(false)}
                          aria-hidden="true"
                        />
                        <div
                          role="menu"
                          className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                        >
                          {bulkActions.map((action) => (
                            <button
                              key={action.id}
                              type="button"
                              role="menuitem"
                              onClick={() => invokeBulk(action)}
                              className={cn(
                                "flex w-full items-center px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-slate-100",
                                action.variant === "danger"
                                  ? "text-red-600"
                                  : "text-slate-700"
                              )}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" aria-hidden="true" />
            ) : null}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {selectable ? <th scope="col" className="w-10 px-4 py-2.5" /> : null}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      sort === col.key ? (dir === "asc" ? "ascending" : "descending") : undefined
                    }
                    className={cn(
                      "px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500",
                      col.hideBelow && HIDE_CLASS[col.hideBelow],
                      col.headerClassName
                    )}
                  >
                    {col.sortable && sorts.some((s) => s.key === col.key) ? (
                      <button
                        type="button"
                        onClick={() => startTransition(() => toggleSort(col.key))}
                        className="inline-flex items-center gap-1 transition-colors hover:text-slate-800"
                      >
                        {col.header}
                        <span aria-hidden="true" className="text-[10px]">
                          {sort === col.key ? (dir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const id = rowKey(row);
                const selected = selectedIds.includes(id);
                return (
                  <tr
                    key={id}
                    className={cn(
                      "transition-colors",
                      selected ? "bg-blue-50/60" : "hover:bg-slate-50"
                    )}
                  >
                    {selectable && onSelectionChange ? (
                      <td className="px-4 py-3 align-top">
                        <label className="sr-only" htmlFor={`select-${id}`}>
                          Select row
                        </label>
                        <input
                          id={`select-${id}`}
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleOne(id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </td>
                    ) : null}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 align-middle text-slate-700",
                          col.hideBelow && HIDE_CLASS[col.hideBelow],
                          col.className
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {confirming ? (
        <BulkConfirmDialog
          action={confirming}
          count={selectedIds.length}
          pending={pending}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const action = confirming;
            setConfirming(null);
            startTransition(() => onBulk?.(action.id, selectedIds));
          }}
        />
      ) : null}
    </>
  );
}

/** Native-dialog-based confirmation for bulk actions that change many rows. */
function BulkConfirmDialog({
  action,
  count,
  pending,
  onCancel,
  onConfirm,
}: {
  action: BulkAction;
  count: number;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // `showModal` gives focus trapping, Escape handling, and backdrop click
  // handling without hand-rolling any of it.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === ref.current && !pending) onCancel();
      }}
      aria-labelledby="bulk-confirm-title"
      className="m-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl backdrop:bg-slate-900/40"
    >
      <h2 id="bulk-confirm-title" className="text-sm font-semibold text-slate-900">
        {action.confirm?.title ?? action.label}
      </h2>
      <p className="mt-1.5 text-sm text-slate-600">
        {action.confirm?.body ?? `Apply "${action.label}" to ${count} selected rows?`}
      </p>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60",
            action.confirm?.destructive
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          )}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {action.confirm?.confirmLabel ?? action.label}
        </button>
      </div>
    </dialog>
  );
}

// --- Pagination -----------------------------------------------------------

export function Pagination({
  page,
  total,
  perPage = PER_PAGE,
  totalLabel,
}: {
  page: number;
  total: number;
  perPage?: number;
  totalLabel?: (count: number) => string;
}) {
  const { setPage } = useTableState();
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  if (total === 0) return null;

  // Windowed page numbers: 1 … 4 5 [6] 7 8 … 20
  const numbers: (number | "gap")[] = [];
  const window = 2;
  for (let n = 1; n <= totalPages; n += 1) {
    if (n === 1 || n === totalPages || (n >= page - window && n <= page + window)) {
      numbers.push(n);
    } else if (numbers[numbers.length - 1] !== "gap") {
      numbers.push("gap");
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-slate-500">
        {totalLabel ? (
          totalLabel(total)
        ) : (
          <>
            Showing <span className="font-medium text-slate-700">{from}</span>-
            <span className="font-medium text-slate-700">{to}</span> of{" "}
            <span className="font-medium text-slate-700">{total}</span>
          </>
        )}
      </p>

      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          {numbers.map((n, i) =>
            n === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-slate-400" aria-hidden="true">
                &hellip;
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={n === page ? "page" : undefined}
                className={cn(
                  "min-w-8 rounded-lg px-2 py-1.5 text-center text-sm font-medium transition-colors",
                  n === page
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {n}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </nav>
  );
}

export { PER_PAGE };