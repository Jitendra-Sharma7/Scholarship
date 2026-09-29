import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Award,
  Building2,
  CalendarClock,
  FileText,
  Flag,
  GraduationCap,
  Inbox,
  Library,
  Newspaper,
  Star,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";

import { requireStaff } from "@/lib/auth";
import { getSettingNumber } from "@/lib/settings";
import {
  getDashboardStats,
  getRecentActivity,
  getRecentContent,
  getScholarshipBreakdowns,
  type BreakdownItem,
  type RecentContentItem,
} from "@/lib/admin-dashboard";
import { QUICK_ACTIONS } from "@/lib/admin-nav";
import { StatCard, Panel, PanelHeader, Badge } from "@/components/admin/ui/primitives";
import { QuickActions } from "@/components/admin/QuickActions";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireStaff();
  const closingSoonDays = await getSettingNumber("scholarships.closingSoonDays", 14);

  const [stats, breakdowns, recent, activity] = await Promise.all([
    getDashboardStats(closingSoonDays),
    getScholarshipBreakdowns(),
    getRecentContent(),
    getRecentActivity(),
  ]);

  const s = stats.scholarships;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Welcome back, {user.name?.split(" ")[0] || "administrator"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Here is what is happening across Global Scholarship Hub.
        </p>
      </header>

      {/* Primary scholarship numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Scholarships"
          value={s.total}
          hint={`${s.draft} draft`}
          icon={<GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />}
          tone="blue"
          href="/admin/scholarships"
        />
        <StatCard
          label="Active"
          value={s.open}
          hint="deadline in the future"
          icon={<TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />}
          tone="green"
          href="/admin/scholarships?status=PUBLISHED"
        />
        <StatCard
          label="Closing Soon"
          value={s.closingSoon}
          hint={`within ${closingSoonDays} days`}
          icon={<CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />}
          tone="amber"
          href={`/admin/scholarships?deadline=closing`}
        />
        <StatCard
          label="Fully Funded"
          value={s.fullyFunded}
          icon={<Award className="h-3.5 w-3.5" aria-hidden="true" />}
          tone="purple"
          href="/admin/scholarships?fullyFunded=1"
        />
        <StatCard
          label="Featured"
          value={s.featured}
          icon={<Star className="h-3.5 w-3.5" aria-hidden="true" />}
          tone="amber"
          href="/admin/scholarships?featured=1"
        />
        <StatCard
          label="Expired"
          value={s.expired}
          icon={<CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />}
          tone="neutral"
          href="/admin/scholarships?deadline=expired"
        />
      </div>

      {/* Content and audience counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Universities"
          value={stats.universities.total}
          icon={<Building2 className="h-3.5 w-3.5" aria-hidden="true" />}
          href="/admin/universities"
        />
        <StatCard
          label="Countries"
          value={stats.countries.total}
          icon={<Flag className="h-3.5 w-3.5" aria-hidden="true" />}
          href="/admin/countries"
        />
        <StatCard
          label="Fields"
          value={stats.fields.total}
          icon={<Library className="h-3.5 w-3.5" aria-hidden="true" />}
          href="/admin/fields"
        />
        <StatCard
          label="Blog Posts"
          value={stats.blog.total}
          hint={`${stats.blog.published} published · ${stats.blog.draft} draft`}
          icon={<Newspaper className="h-3.5 w-3.5" aria-hidden="true" />}
          href="/admin/blog"
        />
        <StatCard
          label="Resources"
          value={stats.resources.total}
          icon={<FileText className="h-3.5 w-3.5" aria-hidden="true" />}
          href="/admin/resources"
        />
        <StatCard
          label="Users"
          value={stats.users.total}
          hint={`+${stats.users.newThisMonth} this month`}
          icon={<Users className="h-3.5 w-3.5" aria-hidden="true" />}
          tone="blue"
          href="/admin/users"
        />
      </div>

      {/* Needs attention */}
      {stats.submissions.pending > 0 || s.inTrash > 0 || stats.users.suspended > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.submissions.pending > 0 ? (
            <Link
              href="/admin/submissions"
              className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:border-amber-300"
            >
              <Inbox className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-amber-900">
                  {stats.submissions.pending} submission
                  {stats.submissions.pending === 1 ? "" : "s"} to review
                </span>
                <span className="block text-xs text-amber-700">Waiting for a decision</span>
              </span>
            </Link>
          ) : null}
          {s.inTrash > 0 ? (
            <Link
              href="/admin/scholarships?trash=1"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
            >
              <Trash2 className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  {s.inTrash} in trash
                </span>
                <span className="block text-xs text-slate-500">Restorable scholarship records</span>
              </span>
            </Link>
          ) : null}
          {stats.users.suspended > 0 ? (
            <Link
              href="/admin/users?suspended=yes"
              className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 transition-colors hover:border-red-300"
            >
              <Users className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-red-900">
                  {stats.users.suspended} suspended account
                  {stats.users.suspended === 1 ? "" : "s"}
                </span>
                <span className="block text-xs text-red-700">Cannot sign in</span>
              </span>
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownPanel title="Scholarships by country" items={breakdowns.byCountry} />
        <BreakdownPanel title="Scholarships by field" items={breakdowns.byField} />
        <BreakdownPanel title="By degree level" items={breakdowns.byDegree} />
        <BreakdownPanel title="By funding type" items={breakdowns.byFunding} />
      </div>

      {/* Quick actions */}
      <Panel>
        <PanelHeader
          title="Quick actions"
          description="Create new content without leaving the dashboard."
        />
        <QuickActions actions={QUICK_ACTIONS} />
      </Panel>

      {/* Recent content */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentPanel title="Recently added scholarships" items={recent.scholarshipsAdded} />
        <RecentPanel title="Recently updated scholarships" items={recent.scholarshipsUpdated} />
        <RecentPanel title="Recently added universities" items={recent.universities} />
        <RecentPanel title="Recently published posts" items={recent.blogPosts} />
      </div>

      <RecentPanel title="Recently registered users" items={recent.users} />

      {/* Activity */}
      <Panel>
        <PanelHeader
          title="Recent admin activity"
          description="Every change made in this panel is recorded."
          action={
            <Link
              href="/admin/activity"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              View full log
            </Link>
          }
        />
        {activity.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No activity recorded yet. Actions taken in the admin panel will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {activity.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-slate-700">{item.summary}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {item.actorEmail ?? "system"} · {formatRelative(item.createdAt)}
                  </span>
                </span>
                <Badge tone="neutral">{item.entityType}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function BreakdownPanel({ title, items }: { title: string; items: BreakdownItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Panel>
      <PanelHeader title={title} />
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No data yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const pct = Math.round((item.count / max) * 100);
            const row = (
              <>
                <span className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-slate-700">{item.label}</span>
                  <span className="shrink-0 font-semibold text-slate-900">{item.count}</span>
                </span>
                <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-blue-500"
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </>
            );
            return (
              <li key={item.label}>
                {item.href ? (
                  <Link href={item.href} className="block rounded-lg transition-opacity hover:opacity-80">
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function RecentPanel({ title, items }: { title: string; items: RecentContentItem[] }) {
  return (
    <Panel>
      <PanelHeader title={title} />
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Nothing here yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {item.title}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {item.meta} · {formatRelative(item.updatedAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toISOString().slice(0, 10);
}
