"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CalendarClock, Inbox, Loader2, UserPlus } from "lucide-react";

import type { AdminNotificationView } from "@/lib/admin-notifications";
import { fetchAdminNotifications } from "@/app/actions/admin-search-actions";
import { cn } from "@/lib/utils";

const ICON_BY_TYPE = {
  deadline: CalendarClock,
  user: UserPlus,
  submission: Inbox,
} as const;

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotificationView[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // The server-rendered count can change between navigations (another admin
  // acted, or the page re-rendered). Resync during render rather than in an
  // effect, which would leave a frame showing the stale badge.
  const [lastInitial, setLastInitial] = useState(initialUnread);
  if (initialUnread !== lastInitial) {
    setLastInitial(initialUnread);
    setUnread(initialUnread);
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAdminNotifications();
      if ("error" in data) return;
      setItems(data.items);
      setUnread(data.unread);
      setLoaded(true);
    } catch {
      // Leave the panel empty rather than showing a broken state.
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) void load();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
      >
        <Bell className="h-4.5 w-4.5" aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            {unread > 0 ? (
              <span className="text-xs font-medium text-blue-600">{unread} unread</span>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading...
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">
                Nothing needs your attention.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => {
                  const Icon =
                    ICON_BY_TYPE[item.type as keyof typeof ICON_BY_TYPE] ?? Bell;
                  const body = (
                    <>
                      <span
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          item.read ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-sm",
                            item.read ? "text-slate-600" : "font-semibold text-slate-900"
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                          {item.message}
                        </span>
                        <span className="mt-1 block text-[11px] text-slate-400">
                          {relativeTime(item.createdAt)}
                        </span>
                      </span>
                    </>
                  );

                  return (
                    <li key={item.id}>
                      {item.link ? (
                        <Link
                          href={item.link}
                          onClick={() => setOpen(false)}
                          className="flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="flex gap-3 px-4 py-3">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
