"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "react-hot-toast";

import { DataTable, Pagination, TableToolbar, type Column } from "@/components/admin/ui/DataTable";
import { Badge, EmptyState } from "@/components/admin/ui/primitives";
import { deleteIntake } from "@/app/actions/intake-actions";
import type { IntakeData } from "@/lib/data/intakes";
import { formatDate } from "@/lib/utils";

export function IntakeTable({
  intakes,
  canEdit,
  canDelete,
}: {
  intakes: IntakeData[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const columns: Column<IntakeData>[] = [
    {
      key: "name",
      header: "Intake",
      sortable: true,
      cell: (intake) => (
        <div className="min-w-0">
          <Link
            href={`/admin/intakes/${intake.id}/edit`}
            className="truncate font-medium text-slate-900 hover:text-blue-700 hover:underline"
          >
            {intake.name}
          </Link>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {intake.startMonth}/{intake.startYear}
            {intake.endMonth && intake.endYear ? ` – ${intake.endMonth}/${intake.endYear}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (intake) => (
        <Badge tone={intake.isActive ? "green" : "neutral"}>
          {intake.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "scholarshipCount",
      header: "Scholarships",
      sortable: true,
      cell: (intake) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-slate-600">
          {intake.scholarshipCount ?? 0}
        </span>
      ),
    },
    {
      key: "sortOrder",
      header: "Order",
      sortable: true,
      hideBelow: "md",
      cell: (intake) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-slate-600">
          {intake.sortOrder}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      hideBelow: "lg",
      cell: (intake) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-slate-600">
          {formatDate(intake.createdAt ?? null)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-10",
      cell: (intake) => (
        <div className="relative flex justify-end">
          <button
            type="button"
            aria-label={`Actions for ${intake.name}`}
            aria-haspopup="menu"
            aria-expanded={openMenu === intake.id}
            onClick={() => setOpenMenu(openMenu === intake.id ? null : intake.id)}
            disabled={!canEdit || pending}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            {busyId === intake.id ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {openMenu === intake.id ? (
            <RowMenu
              intake={intake}
              canDelete={canDelete}
              onClose={() => setOpenMenu(null)}
              onBusy={() => setBusyId(intake.id)}
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
      <TableToolbar
        searchPlaceholder="Search by intake name"
        filters={[]}
      />

      <DataTable
        rows={intakes}
        columns={columns}
        rowKey={(r) => r.id}
        sorts={[
          { key: "name", label: "Name" },
          { key: "startYear", label: "Year" },
          { key: "scholarshipCount", label: "Scholarships" },
          { key: "sortOrder", label: "Order" },
          { key: "createdAt", label: "Created" },
        ]}
        defaultSort={{ key: "startYear", dir: "desc" }}
        selectable={canEdit}
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={[]}
        onBulk={() => {}}
        caption="Intakes"
        emptyState={
          <EmptyState
            title="No intakes configured"
            description="Create your first intake to organize scholarships by academic period."
            action={
              <Link
                href="/admin/intakes/new"
                className="rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add Intake
              </Link>
            }
          />
        }
        renderCard={(intake) => (
          <div>
            <Link
              href={`/admin/intakes/${intake.id}/edit`}
              className="text-sm font-medium text-slate-900 hover:text-blue-700 hover:underline"
            >
              {intake.name}
            </Link>
            <p className="mt-0.5 text-xs text-slate-500">
              {intake.startMonth}/{intake.startYear}
              {intake.endMonth && intake.endYear ? ` – ${intake.endMonth}/${intake.endYear}` : ""}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <Badge tone={intake.isActive ? "green" : "neutral"}>
                {intake.isActive ? "Active" : "Inactive"}
              </Badge>
              <span className="text-xs text-slate-500">
                {intake.scholarshipCount ?? 0} scholarships
              </span>
            </div>
          </div>
        )}
      />

      <Pagination
        page={1}
        total={intakes.length}
        perPage={intakes.length}
        totalLabel={(count) => `${count.toLocaleString()} intake${count === 1 ? "" : "s"}`}
      />
    </div>
  );
}

function RowMenu({
  intake,
  canDelete,
  onClose,
  onBusy,
  onDone,
}: {
  intake: IntakeData;
  canDelete: boolean;
  onClose: () => void;
  onBusy: () => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function exec(fn: () => Promise<{ error?: string } | undefined>, message: string) {
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
      <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden="true" />
      <div
        role="menu"
        className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
      >
        <Link
          href={`/admin/intakes/${intake.id}/edit`}
          role="menuitem"
          className={itemClass}
          onClick={onClose}
        >
          Edit
        </Link>

        <button
          type="button"
          role="menuitem"
          disabled={pending}
          className={`${itemClass} ${intake.isActive ? "text-slate-700" : "text-emerald-700"}`}
          onClick={() =>
            exec(
              async () => {
                const res = await fetch(`/admin/api/intakes/${intake.id}/toggle`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                });
                return res.json();
              },
              intake.isActive ? "Deactivated" : "Activated"
            )
          }
        >
          {intake.isActive ? "Deactivate" : "Activate"}
        </button>

        {canDelete ? (
          <button
            type="button"
            role="menuitem"
            disabled={pending}
            className={`${itemClass} text-red-600 hover:bg-red-50`}
            onClick={() => exec(() => deleteIntake(intake.id), "Deleted")}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </button>
        ) : null}
      </div>
    </>
  );
}