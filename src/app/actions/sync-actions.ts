"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { atLeast, getCurrentUser, isStaff } from "@/lib/auth";
import { recordActivity } from "@/lib/audit";
import { scrapeGlobalScholarshipPoint, mapScrapedToPrisma } from "@/lib/scraping/globalscholarshippoint";

export interface SyncActionState {
  error?: string;
  success?: string;
  stats?: {
    totalFound: number;
    totalNew: number;
    totalUpdated: number;
    totalErrors: number;
  };
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    throw new Error("You must be signed in as an administrator.");
  }
  if (!atLeast(user.role, "ADMIN")) {
    throw new Error("Your role does not have permission to do that.");
  }
  return user;
}

export async function runSyncNow(
  _prev: SyncActionState,
  formData: FormData
): Promise<SyncActionState> {
  let actor;
  try {
    actor = await requireAdmin();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Authorization failed" };
  }

  const sourceUrl = formData.get("sourceUrl") as string || "https://globalscholarshippoint.com/";
  const sourceName = formData.get("sourceName") as string || "Global Scholarship Point";
  const targetIntake = formData.get("targetIntake") as string || "September 2027";

  const syncLog = await prisma.syncLog.create({
    data: {
      sourceUrl,
      sourceName,
      status: "RUNNING",
      triggeredBy: "manual",
      triggeredById: actor.id,
    },
  });

  try {
    const { scholarships: scraped, errors } = await scrapeGlobalScholarshipPoint(targetIntake);

    let totalNew = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    for (const scrapedScholarship of scraped) {
      try {
        const data = mapScrapedToPrisma(scrapedScholarship);

        const existing = await prisma.scholarship.findFirst({
          where: {
            OR: [
              { officialUrl: scrapedScholarship.officialUrl },
              { source: scrapedScholarship.sourceUrl },
              { title: { equals: scrapedScholarship.title, mode: "insensitive" } },
            ],
            deletedAt: null,
          },
        });

        if (existing) {
          await prisma.scholarship.update({
            where: { id: existing.id },
            data: {
              ...data,
              updatedAt: new Date(),
              lastVerifiedAt: new Date(),
              verificationStatus: "VERIFICATION_NEEDED",
            },
          });
          totalUpdated++;
        } else {
          await prisma.scholarship.create({ data });
          totalNew++;
        }
      } catch (error) {
        totalErrors++;
        console.error("Error saving scholarship:", error);
      }
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: totalErrors > 0 && totalNew + totalUpdated === 0 ? "FAILED" : 
                totalErrors > 0 ? "PARTIAL" : "COMPLETED",
        completedAt: new Date(),
        totalFound: scraped.length,
        totalNew,
        totalUpdated,
        totalErrors,
        errorDetails: errors.length > 0 ? errors : null,
      },
    });

    await recordActivity({
      action: "sync.run",
      entityType: "SyncLog",
      entityId: syncLog.id,
      summary: `Manual sync from ${sourceName}: ${totalNew} new, ${totalUpdated} updated, ${totalErrors} errors`,
      metadata: { sourceName, targetIntake, totalFound: scraped.length },
      actor: { id: actor.id, email: actor.email },
    });

    revalidatePath("/admin/sync");
    revalidatePath("/admin/scholarships");

    return {
      success: `Sync completed: ${totalNew} new scholarships, ${totalUpdated} updated, ${totalErrors} errors`,
      stats: { totalFound: scraped.length, totalNew, totalUpdated, totalErrors },
    };
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        totalErrors: 1,
        errorDetails: [error instanceof Error ? error.message : "Unknown error"],
      },
    });

    return { error: error instanceof Error ? error.message : "Sync failed" };
  }
}

export async function getSyncLogs(page = 1, limit = 20) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return { logs: [], total: 0, page, totalPages: 0 };
  }

  const [logs, total] = await Promise.all([
    prisma.syncLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.syncLog.count(),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getSyncLogById(id: string) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return null;
  }

  return prisma.syncLog.findUnique({
    where: { id },
  });
}

export async function retryFailedSync(id: string): Promise<SyncActionState> {
  let actor;
  try {
    actor = await requireAdmin();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Authorization failed" };
  }

  const existingLog = await prisma.syncLog.findUnique({ where: { id } });
  if (!existingLog) {
    return { error: "Sync log not found" };
  }

  return runSyncNow(
    {},
    new FormData([
      ["sourceUrl", existingLog.sourceUrl],
      ["sourceName", existingLog.sourceName],
      ["targetIntake", "September 2027"],
    ])
  );
}