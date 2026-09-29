import { prisma } from "@/lib/prisma";

export interface AdminNotificationView {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  /** ISO string so the client can render a relative time without a date lib. */
  createdAt: string;
  type: string;
}

export async function getAdminNotifications(take = 15): Promise<{
  items: AdminNotificationView[];
  unread: number;
}> {
  const [items, unread] = await Promise.all([
    prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.adminNotification.count({ where: { read: false } }),
  ]);

  return {
    items: items.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      link: n.link,
      read: n.read,
      type: n.type,
      createdAt: n.createdAt.toISOString(),
    })),
    unread,
  };
}

/**
 * Derives operational notifications from live data.
 *
 * Instead of storing "a scholarship is closing soon" rows that would go stale,
 * these are computed on read: closing deadlines, new signups and pending
 * submissions. Explicit rows in AdminNotification are shown alongside them.
 */
export async function getDerivedAlerts(closingSoonDays = 14): Promise<AdminNotificationView[]> {
  const now = new Date();
  const cutoff = new Date(now.getTime() + closingSoonDays * 24 * 60 * 60 * 1000);

  const [closing, newUsers, pendingSubs] = await Promise.all([
    prisma.scholarship.findMany({
      where: {
        deletedAt: null,
        publishStatus: "PUBLISHED",
        deadline: { gte: now, lte: cutoff },
      },
      select: { id: true, title: true, deadline: true },
      orderBy: { deadline: "asc" },
      take: 8,
    }),
    prisma.user.count({ where: { createdAt: { gte: new Date(now.getTime() - 7 * 86400000) } } }),
    prisma.submission.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] }, deletedAt: null } }),
  ]);

  const alerts: AdminNotificationView[] = [];

  if (closing.length > 0) {
    alerts.push({
      id: `alert-deadlines-${now.toISOString().slice(0, 10)}`,
      type: "deadline",
      title: `${closing.length} scholarship${closing.length === 1 ? "" : "s"} closing soon`,
      message:
        closing.length === 1
          ? `"${closing[0].title}" closes ${formatWhen(closing[0].deadline)}.`
          : `The soonest is "${closing[0].title}" on ${formatWhen(closing[0].deadline)}.`,
      link: "/admin/scholarships?status=OPEN",
      read: false,
      createdAt: now.toISOString(),
    });
  }

  if (newUsers > 0) {
    alerts.push({
      id: `alert-users-${now.toISOString().slice(0, 7)}`,
      type: "user",
      title: `${newUsers} new user${newUsers === 1 ? "" : "s"} this week`,
      message: "New accounts registered in the last seven days.",
      link: "/admin/users",
      read: false,
      createdAt: now.toISOString(),
    });
  }

  if (pendingSubs > 0) {
    alerts.push({
      id: `alert-submissions-${now.toISOString().slice(0, 10)}`,
      type: "submission",
      title: `${pendingSubs} submission${pendingSubs === 1 ? "" : "s"} awaiting review`,
      message: "Community submissions are waiting for a decision.",
      link: "/admin/submissions",
      read: false,
      createdAt: now.toISOString(),
    });
  }

  return alerts;
}

function formatWhen(date: Date | null): string {
  if (!date) return "soon";
  return date.toISOString().slice(0, 10);
}
