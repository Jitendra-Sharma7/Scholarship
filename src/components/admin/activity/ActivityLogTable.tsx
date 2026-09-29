"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, Loader2, Search } from "lucide-react";
import { toast } from "react-hot-toast";

import { Pagination } from "@/components/admin/ui/DataTable";
import { Badge, EmptyState, Panel, type BadgeTone } from "@/components/admin/ui/primitives";
import type { ActivityRow } from "@/lib/admin-activity";

/**
 * Audit trail browser.
 *
 * Read-only by design: the table renders exactly what the server sent, and the
 * only client-side behaviour is filtering the view and exporting what is already
 * loaded.
 */

const TONES: Record<string, BadgeTone> = {
  Scholarship: "blue",
  University: "purple",
  Country: "green",
  Field: "green",
  BlogPost: "amber",
  Resource: "amber",
  User: "neutral",
  Submission: "amber",
  Setting: "neutral",
  Auth: "red",
  Redirect: "neutral",
  Media: "neutral",
};

export function ActivityLogTable({
  rows,
  total,
  page,
  perPage,
  facets,
}: {
  rows: ActivityRow[];
  total: number;
  page: number;
  perPage: number;
  facets: {
    actions: string[];
    entityTypes: string[];
    actors: { id: string; email: string }[];
  };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [term, setTerm] = useState(params.get("q") ?? "");

  function setParam(name: string, value: string | null) {
    const sp = new URLSearchParams(params.toString());
    if (value === null || value === "") sp.delete(name);
    else sp.set(name, value);
    if (name !== "page") sp.set("page", "1");
    const qs = sp.toString();
    router.replace(qs ? `/admin/activity?${qs}` : "/admin/activity", { scroll: false });
  }

  return (
    <div>
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <form
            className="min-w-0 flex-1 sm:max-w-xs"
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", term || null);
            }}
          >
            <label htmlFor="activity-search" className="sr-only">
              Search the activity log
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="activity-search"
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search summaries, actions or actors"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </form>

          <button
            type="button"
            disabled={pending || rows.length === 0}
            onClick={() =>
              startTransition(() => {
                // Built client-side from the rows already on screen, so the
                // export matches what the admin is looking at.
                const header = ["when", "action", "entityType", "entityId", "actor", "summary"];
                const body = rows.map((r) =>
                  [r.createdAt, r.action, r.entityType, r.entityId ?? "", r.actorEmail ?? "", r.summary]
                    .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                    .join(",")
                );
                const blob = new Blob([[header.join(","), ...body].join("\n")], {
                  type: "text/csv;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `activity-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success(`Exported ${rows.length} entries from this page.`);
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            Export this page
          </button>

          {params.toString() ? (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                router.replace("/admin/activity", { scroll: false });
              }}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="filter-action" className="mb-1 block text-xs font-medium text-slate-600">
              Action
            </label>
            <select
              id="filter-action"
              value={params.get("action") ?? ""}
              onChange={(e) => setParam("action", e.target.value || null)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All actions</option>
              {facets.actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-entity" className="mb-1 block text-xs font-medium text-slate-600">
              Record type
            </label>
            <select
              id="filter-entity"
              value={params.get("entityType") ?? ""}
              onChange={(e) => setParam("entityType", e.target.value || null)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All types</option>
              {facets.entityTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-actor" className="mb-1 block text-xs font-medium text-slate-600">
              Actor
            </label>
            <select
              id="filter-actor"
              value={params.get("actorId") ?? ""}
              onChange={(e) => setParam("actorId", e.target.value || null)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Everyone</option>
              {facets.actors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="filter-from" className="mb-1 block text-xs font-medium text-slate-600">
                From
              </label>
              <input
                id="filter-from"
                type="date"
                value={params.get("from") ?? ""}
                onChange={(e) => setParam("from", e.target.value || null)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="filter-to" className="mb-1 block text-xs font-medium text-slate-600">
                To
              </label>
              <input
                id="filter-to"
                type="date"
                value={params.get("to") ?? ""}
                onChange={(e) => setParam("to", e.target.value || null)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No activity matches these filters"
          description="Adjust the filters, or clear them to see the full trail."
        />
      ) : (
        <Panel padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Administrative activity, most recent first. Read-only.
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    When
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actor
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Summary
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top transition-colors hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-slate-500">
                      {row.createdAt}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block max-w-[14rem] truncate text-xs text-slate-700">
                        {row.actorEmail ?? "system"}
                      </span>
                      {row.ipAddress ? (
                        <span className="block text-[11px] text-slate-400">{row.ipAddress}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                          {row.action}
                        </code>
                        <Badge tone={TONES[row.entityType] ?? "neutral"}>{row.entityType}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Pagination
        page={page}
        total={total}
        perPage={perPage}
        totalLabel={(count) => `${count.toLocaleString("en-GB")} log entries`}
      />

      <p className="mt-4 text-xs text-slate-500">
        Entries are written by the server on every administrative change and cannot be edited or
        deleted from the panel. Timestamps are UTC. &ldquo;Export this page&rdquo; downloads the{" "}
        {rows.length} entries currently shown, not the whole log.
      </p>
    </div>
  );
}
