import { prisma } from "@/lib/prisma";
import { getSettingNumber } from "@/lib/settings";

export type AlertType = "THIRTY_DAYS" | "FIFTEEN_DAYS" | "SEVEN_DAYS" | "ONE_DAY" | "ON_DEADLINE" | "OPENING_SOON";

const ALERT_DAYS: Record<AlertType, number> = {
  THIRTY_DAYS: 30,
  FIFTEEN_DAYS: 15,
  SEVEN_DAYS: 7,
  ONE_DAY: 1,
  ON_DEADLINE: 0,
  OPENING_SOON: -7, // 7 days before opening
};

export async function generateDeadlineAlerts() {
  const now = new Date();
  const closingSoonDays = await getSettingNumber("scholarships.closingSoonDays", 14);

  // Get all published scholarships with deadlines
  const scholarships = await prisma.scholarship.findMany({
    where: {
      publishStatus: "PUBLISHED",
      deletedAt: null,
      deadline: { not: null },
    },
    select: {
      id: true,
      title: true,
      deadline: true,
      openingDate: true,
    },
  });

  // Get all users who have scholarship matches or applications
  const userIds = await prisma.scholarshipMatch.findMany({
    where: {
      scholarshipId: { in: scholarships.map(s => s.id) },
      status: { in: ["SUGGESTED", "INTERESTED", "APPLYING"] },
    },
    select: { userId: true, scholarshipId: true },
    distinct: ["userId", "scholarshipId"],
  });

  const alertsToCreate: Array<{
    userId: string;
    scholarshipId: string;
    alertType: AlertType;
    sendAt: Date;
  }> = [];

  for (const scholarship of scholarships) {
    if (!scholarship.deadline) continue;

    const deadline = new Date(scholarship.deadline);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Determine which alert types should trigger
    const applicableAlerts: AlertType[] = [];
    
    for (const [alertType, daysBefore] of Object.entries(ALERT_DAYS)) {
      const alertDate = new Date(deadline.getTime() - daysBefore * 24 * 60 * 60 * 1000);
      
      // Alert should be sent if we're past the alert date but haven't sent it yet
      if (now >= alertDate && daysUntilDeadline >= 0) {
        applicableAlerts.push(alertType as AlertType);
      }
    }

    // Also check opening date alerts
    if (scholarship.openingDate) {
      const opening = new Date(scholarship.openingDate);
      const daysUntilOpening = Math.ceil((opening.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilOpening > 0 && daysUntilOpening <= 7) {
        applicableAlerts.push("OPENING_SOON");
      }
    }

    // Find users interested in this scholarship
    const interestedUsers = userIds
      .filter(u => u.scholarshipId === scholarship.id)
      .map(u => u.userId);

    for (const userId of interestedUsers) {
      for (const alertType of applicableAlerts) {
        const daysBefore = ALERT_DAYS[alertType];
        const sendAt = alertType === "OPENING_SOON" && scholarship.openingDate
          ? new Date(new Date(scholarship.openingDate).getTime() - 7 * 24 * 60 * 60 * 1000)
          : new Date(deadline.getTime() - daysBefore * 24 * 60 * 60 * 1000);

        // Check if alert already exists
        const existing = await prisma.deadlineAlert.findUnique({
          where: {
            userId_scholarshipId_alertType: { userId, scholarshipId: scholarship.id, alertType },
          },
        });

        if (!existing && sendAt <= now) {
          alertsToCreate.push({ userId, scholarshipId: scholarship.id, alertType, sendAt });
        }
      }
    }
  }

  // Bulk create alerts
  if (alertsToCreate.length > 0) {
    await prisma.deadlineAlert.createMany({
      data: alertsToCreate,
      skipDuplicates: true,
    });
  }

  return { created: alertsToCreate.length };
}

export async function sendPendingAlerts() {
  const now = new Date();

  const pendingAlerts = await prisma.deadlineAlert.findMany({
    where: {
      isSent: false,
      sendAt: { lte: now },
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
      scholarship: { select: { id: true, title: true, deadline: true, openingDate: true, slug: true } },
    },
    take: 100,
  });

  let sent = 0;

  for (const alert of pendingAlerts) {
    try {
      // Create notification
      const alertMessages: Record<AlertType, string> = {
        THIRTY_DAYS: `30 days until deadline for "${alert.scholarship.title}"`,
        FIFTEEN_DAYS: `15 days until deadline for "${alert.scholarship.title}"`,
        SEVEN_DAYS: `1 week until deadline for "${alert.scholarship.title}"`,
        ONE_DAY: `Tomorrow is the deadline for "${alert.scholarship.title}"`,
        ON_DEADLINE: `Today is the deadline for "${alert.scholarship.title}"`,
        OPENING_SOON: `Applications open soon for "${alert.scholarship.title}"`,
      };

      await prisma.notification.create({
        data: {
          userId: alert.userId,
          type: "DEADLINE_ALERT",
          title: "Scholarship Deadline Alert",
          message: alertMessages[alert.alertType],
          read: false,
        },
      });

      await prisma.deadlineAlert.update({
        where: { id: alert.id },
        data: { isSent: true, sentAt: now },
      });

      sent++;
    } catch (error) {
      console.error(`Failed to send alert ${alert.id}:`, error);
    }
  }

  return { sent };
}

export async function getUserDeadlineAlerts(userId: string, unreadOnly = false) {
  return prisma.deadlineAlert.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    include: {
      scholarship: {
        select: {
          id: true,
          title: true,
          deadline: true,
          slug: true,
          university: { select: { name: true } },
          country: { select: { name: true, code: true } },
        },
      },
    },
    orderBy: { sendAt: "asc" },
  });
}

export async function markAlertRead(alertId: string, userId: string) {
  return prisma.deadlineAlert.update({
    where: { id: alertId, userId },
    data: { isRead: true },
  });
}

export async function dismissAlert(alertId: string, userId: string) {
  return prisma.deadlineAlert.delete({
    where: { id: alertId, userId },
  });
}

export async function getUpcomingDeadlines(userId: string, days = 30) {
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  return prisma.scholarshipMatch.findMany({
    where: {
      userId,
      status: { in: ["SUGGESTED", "INTERESTED", "APPLYING"] },
      scholarship: {
        publishStatus: "PUBLISHED",
        deletedAt: null,
        deadline: { lte: cutoff, gte: new Date() },
      },
    },
    include: {
      scholarship: {
        select: {
          id: true,
          title: true,
          deadline: true,
          slug: true,
          university: { select: { name: true } },
          country: { select: { name: true, code: true } },
          fundingType: true,
          isFullyFunded: true,
        },
      },
    },
    orderBy: { scholarship: { deadline: "asc" } },
  });
}