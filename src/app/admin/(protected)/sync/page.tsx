"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, Download, Filter } from "lucide-react";
import { toast } from "react-hot-toast";

import { DataTable, Pagination, TableToolbar, type Column, type FilterField } from "@/components/admin/ui/DataTable";
import { Badge, EmptyState, PageHeader } from "@/components/admin/ui/primitives";
import { runSyncNow, getSyncLogs, retryFailedSync, type SyncLog } from "@/app/actions/sync-actions";
import { formatDate, formatDateLong } from "@/lib/utils";

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "blue" | "purple" | "neutral"> = {
  COMPLETED: "green",
  PARTIAL: "amber",
  FAILED: "red",
  RUNNING: "blue",
  PENDING: "neutral",
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Completed",
  PARTIAL: "Partial",
  FAILED: "Failed",
  RUNNING: "Running",
  PENDING: "Pending",
};

const TRIGGER_LABELS: Record<string, string> = {
  manual: "Manual",
  scheduled: "Scheduled",
  api: "API",
};

export default function SyncManagementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<{ totalFound: number; totalNew: number; totalUpdated: number; totalErrors: number } | null>(null);
  const perPage = 20;

  const parseParams = async () => {
    const params = await searchParams;
    const pageParam = Number(params.page ?? "1");
    return Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  };

  const loadLogs = async (pageNum = 1) => {
    const result = await getSyncLogs(pageNum, perPage);
    setLogs(result.logs);
    setTotal(result.total);
    setPage(result.page);
    setTotalPages(result.totalPages);
  };

  const handleSync = async (formData: FormData) => {
    setIsSyncing(true);
    setSyncStats(null);
    try {
      const result = await runSyncNow({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        if (result.stats) setSyncStats(result.stats);
        loadLogs(1);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetry = async (id: string) => {
    setIsSyncing(true);
    try {
      const result = await retryFailedSync(id);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        if (result.stats) setSyncStats(result.stats);
        loadLogs(page);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const columns: Column<SyncLog>[] = [
    {
      key: "createdAt",
      header: "Started",
      sortable: true,
      cell: (log) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-slate-600">
          {formatDateLong(log.createdAt)}
        </span>
      ),
    },
    {
      key: "sourceName",
      header: "Source",
      sortable: true,
      cell: (log) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{log.sourceName}</p>
          <p className="truncate text-xs text-slate-500">{log.sourceUrl}</p>
        </div>
      ),
    },
    {
      key: "triggeredBy",
      header: "Trigger",
      sortable: true,
      hideBelow: "md",
      cell: (log) => (
        <Badge tone={log.triggeredBy === "manual" ? "blue" : log.triggeredBy === "scheduled" ? "purple" : "neutral"}>
          {TRIGGER_LABELS[log.triggeredBy ?? ""] ?? log.triggeredBy}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (log) => (
        <Badge tone={STATUS_TONE[log.status] ?? "neutral"}>
          {STATUS_LABELS[log.status] ?? log.status}
        </Badge>
      ),
    },
    {
      key: "stats",
      header: "Results",
      hideBelow: "lg",
      cell: (log) => (
        <div className="flex flex-wrap gap-1 text-xs">
          <Badge tone="green">{log.totalNew} new</Badge>
          <Badge tone="blue">{log.totalUpdated} updated</Badge>
          {log.totalErrors > 0 && <Badge tone="red">{log.totalErrors} errors</Badge>}
          <Badge tone="neutral">{log.totalFound} found</Badge>
        </div>
      ),
    },
    {
      key: "completedAt",
      header: "Completed",
      sortable: true,
      hideBelow: "md",
      cell: (log) =>
        log.completedAt ? (
          <span className="whitespace-nowrap text-xs tabular-nums text-slate-600">
            {formatDateLong(log.completedAt)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-10",
      cell: (log) => (
        <div className="flex justify-end">
          {log.status === "FAILED" || log.status === "PARTIAL" ? (
            <button
              type="button"
              disabled={pending || isSyncing}
              onClick={() => handleRetry(log.id)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              aria-label={`Retry sync ${log.id}`}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : log.status === "RUNNING" ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden="true" />
          ) : null}
        </div>
      ),
    },
  ];

  const filters: FilterField[] = [
    {
      name: "status",
      label: "Status",
      options: [
        { value: "", label: "All Statuses" },
        { value: "COMPLETED", label: "Completed" },
        { value: "PARTIAL", label: "Partial" },
        { value: "FAILED", label: "Failed" },
        { value: "RUNNING", label: "Running" },
        { value: "PENDING", label: "Pending" },
      ],
    },
    {
      name: "triggeredBy",
      label: "Trigger",
      options: [
        { value: "", label: "All Triggers" },
        { value: "manual", label: "Manual" },
        { value: "scheduled", label: "Scheduled" },
        { value: "api", label: "API" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sync Management"
        description="Monitor and trigger data synchronization from external scholarship sources."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Sync" }]}
        actions={
          <form action={handleSync} className="flex items-center gap-2">
            <input
              type="hidden"
              name="sourceUrl"
              value="https://globalscholarshippoint.com/"
            />
            <input
              type="hidden"
              name="sourceName"
              value="Global Scholarship Point"
            />
            <input
              type="hidden"
              name="targetIntake"
              value="September 2027"
            />
            <button
              type="submit"
              disabled={pending || isSyncing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
              Sync Now
            </button>
          </form>
        }
      />

      {syncStats && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-emerald-900">Last sync completed</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-emerald-800">
              <span><strong>{syncStats.totalFound}</strong> scholarships found</span>
              <span><strong>{syncStats.totalNew}</strong> new</span>
              <span><strong>{syncStats.totalUpdated}</strong> updated</span>
              {syncStats.totalErrors > 0 && (
                <span className="text-amber-800"><strong>{syncStats.totalErrors}</strong> errors</span>
              )}
            </div>
          </div>
        </div>
      )}

      <TableToolbar
        searchPlaceholder="Search by source name or URL"
        filters={filters}
        extraFilters={
          <form action={handleSync} className="flex items-center gap-2">
            <input
              type="hidden"
              name="sourceUrl"
              value="https://globalscholarshippoint.com/"
            />
            <input
              type="hidden"
              name="sourceName"
              value="Global Scholarship Point"
            />
            <input
              type="hidden"
              name="targetIntake"
              value="September 2027"
            />
            <button
              type="submit"
              disabled={pending || isSyncing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
              Sync Now
            </button>
          </form>
        }
      />

      <DataTable
        rows={logs}
        columns={columns}
        rowKey={(r) => r.id}
        sorts={[
          { key: "createdAt", label: "Started" },
          { key: "sourceName", label: "Source" },
          { key: "status", label: "Status" },
          { key: "completedAt", label: "Completed" },
        ]}
        defaultSort={{ key: "createdAt", dir: "desc" }}
        selectable={false}
        caption="Sync Logs"
        emptyState={
          <EmptyState
            title="No sync logs found"
            description="Run a sync to see the results here."
            action={
              <form action={handleSync}>
                <input type="hidden" name="sourceUrl" value="https://globalscholarshippoint.com/" />
                <input type="hidden" name="sourceName" value="Global Scholarship Point" />
                <input type="hidden" name="targetIntake" value="September 2027" />
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Run First Sync
                </button>
              </form>
            }
          />
        }
        renderCard={(log) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-900">{log.sourceName}</p>
                <p className="text-xs text-slate-500 truncate max-w-xs">{log.sourceUrl}</p>
              </div>
              <Badge tone={STATUS_TONE[log.status] ?? "neutral"}>
                {STATUS_LABELS[log.status] ?? log.status}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              <Badge tone="green">{log.totalNew} new</Badge>
              <Badge tone="blue">{log.totalUpdated} updated</Badge>
              {log.totalErrors > 0 && <Badge tone="red">{log.totalErrors} errors</Badge>}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Started {formatDateLong(log.createdAt)}
              {log.completedAt ? ` · Completed ${formatDateLong(log.completedAt)}` : ""}
            </p>
          </div>
        )}
      />

      <Pagination
        page={page}
        total={total}
        perPage={perPage}
        totalLabel={(count) => `${count.toLocaleString()} sync log${count === 1 ? "" : "s"}`}
      />
    </div>
  );
}