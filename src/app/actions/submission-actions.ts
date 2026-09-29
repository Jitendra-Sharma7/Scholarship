"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_SUBMISSIONS_PER_HOUR, acceptSubmission } from "@/lib/submissions/intake";
import { atLeast, getCurrentUser, isStaff, type SessionUser } from "@/lib/auth";
import { recordActivity } from "@/lib/audit";
import { generateUniqueSlug, slugify } from "@/lib/slug";

/**
 * Review workflow for community submissions.
 *
 * A submission is an unverified claim from the public. Approving one records a
 * decision; only `convertSubmission` creates a real record, and it always
 * creates a *draft* with verification still required. Nothing a member sends can
 * reach the public site without an admin completing the editor and publishing.
 */

export interface SubmissionActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export type SubmitScholarshipResult =
  | { ok: true; id: string; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Public intake, called by the submission form.
 *
 * The browser does not POST to `/api/public/submissions`; it calls this. Same
 * rules either way - both paths run `lib/submissions/intake`.
 */
export async function submitScholarship(input: unknown): Promise<SubmitScholarshipResult> {
  const result = await acceptSubmission(input, {
    throttle: () => rateLimit("submission", MAX_SUBMISSIONS_PER_HOUR),
  });

  if (!result.ok) {
    return { ok: false, error: result.error, fieldErrors: result.fieldErrors };
  }
  return { ok: true, id: result.id, message: result.message };
}

class AuthError extends Error {}

async function requireReviewer(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    throw new AuthError("You must be signed in as an administrator to review submissions.");
  }
  return user;
}

async function requireAdmin(): Promise<SessionUser> {
  const user = await requireReviewer();
  if (!atLeast(user.role, "ADMIN")) {
    throw new AuthError("Your role does not have permission to do that.");
  }
  return user;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "moved back to pending",
  UNDER_REVIEW: "marked as under review",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export async function setSubmissionStatus(
  id: string,
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED",
  internalNotes?: string | null
): Promise<{ error?: string }> {
  let actor: SessionUser;
  try {
    actor = await requireReviewer();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  const submission = await prisma.submission.findUnique({ where: { id }, select: { id: true } });
  if (!submission) return { error: "That submission no longer exists." };

  await prisma.submission.update({
    where: { id },
    data: {
      status,
      internalNotes: internalNotes?.trim() ? internalNotes.trim() : undefined,
      reviewedById: actor.id,
      reviewedAt: new Date(),
    },
  });

  await recordActivity({
    action: `submission.${status.toLowerCase()}`,
    entityType: "Submission",
    entityId: id,
    summary: `Submission ${STATUS_LABEL[status] ?? status.toLowerCase()}`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/api/notifications");
  return {};
}

export async function saveSubmissionNotes(
  id: string,
  internalNotes: string
): Promise<{ error?: string }> {
  let actor: SessionUser;
  try {
    actor = await requireReviewer();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  await prisma.submission.update({
    where: { id },
    data: { internalNotes: internalNotes.trim() || null },
  });

  await recordActivity({
    action: "submission.note",
    entityType: "Submission",
    entityId: id,
    summary: "Added an internal note to a submission",
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/submissions");
  return {};
}

export async function trashSubmission(id: string): Promise<{ error?: string }> {
  let actor: SessionUser;
  try {
    actor = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { id: true, submitterEmail: true },
  });
  if (!submission) return { error: "That submission no longer exists." };

  await prisma.submission.update({ where: { id }, data: { deletedAt: new Date() } });

  await recordActivity({
    action: "submission.trash",
    entityType: "Submission",
    entityId: id,
    summary: `Trashed a submission from ${submission.submitterEmail ?? "an anonymous submitter"}`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/dashboard");
  return {};
}

export async function restoreSubmission(id: string): Promise<{ error?: string }> {
  let actor: SessionUser;
  try {
    actor = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  await prisma.submission.update({ where: { id }, data: { deletedAt: null } });

  await recordActivity({
    action: "submission.restore",
    entityType: "Submission",
    entityId: id,
    summary: "Restored a submission from trash",
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/submissions");
  return {};
}

// --- Conversion ------------------------------------------------------------

type Payload = Record<string, unknown>;

function str(payload: Payload, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function strList(payload: Payload, key: string): string[] {
  const value = payload[key];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/**
 * Creates a draft record from an approved submission.
 *
 * Only what the submitter actually stated is copied, and the result is always a
 * draft that still needs verification, so a conversion can never publish an
 * unverified claim.
 */
export async function convertSubmission(
  id: string,
  countryCode?: string | null
): Promise<{ error?: string; adminPath?: string }> {
  let actor: SessionUser;
  try {
    actor = await requireReviewer();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) return { error: "That submission no longer exists." };
  if (submission.deletedAt) return { error: "Restore the submission before converting it." };
  if (submission.convertedId) {
    return { error: "This submission has already been converted into a record." };
  }
  if (submission.status !== "APPROVED") {
    return { error: "Approve the submission before converting it." };
  }

  const payload =
    submission.payload && typeof submission.payload === "object" && !Array.isArray(submission.payload)
      ? (submission.payload as Payload)
      : {};

  const title = str(payload, "title") ?? "Untitled";
  const description = str(payload, "description");
  const url = str(payload, "officialUrl");
  const slug = await generateUniqueSlug(
    submission.type === "SCHOLARSHIP" ? "scholarship" : "resource",
    slugify(title)
  );

  let convertedId: string | null = null;
  let convertedType: string | null = null;
  let adminPath = "";

  switch (submission.type) {
    case "SCHOLARSHIP": {
      const amount = typeof payload.fundingAmount === "number" ? payload.fundingAmount : null;
      const created = await prisma.scholarship.create({
        data: {
          title,
          slug,
          description,
          shortDescription: description?.slice(0, 300) ?? null,
          officialUrl: url,
          applicationUrl: url,
          deadline: typeof payload.deadline === "string" ? new Date(payload.deadline) : null,
          fundingAmount: amount,
          currency: str(payload, "currency"),
          // A submitted amount is not a verified funding claim. The record stays
          // a draft with `isFullyFunded` off and verification still required, so
          // the reviewer has to confirm the funding before anything is published.
          fundingType: "MIXED",
          isFullyFunded: false,
          degreeLevels: strList(payload, "degreeLevels"),
          fieldLabels: [],
          eligibleCountries: [],
          nationalityRestrictions: [],
          seoKeywords: [],
          documentsRequired: [],
          applicationProcess: [],
          languageReqs: [],
          otherTestReqs: [],
          academicReqs: [],
          selectionCriteria: [],
          source: "community-submission",
          publishStatus: "DRAFT",
        },
        select: { id: true },
      });
      convertedId = created.id;
      convertedType = "Scholarship";
      adminPath = `/admin/scholarships/${created.id}/edit`;
      break;
    }

    case "UNIVERSITY": {
      const created = await prisma.university.create({
        data: {
          name: title,
          slug,
          description,
          website: url,
          popularFields: [],
          seoKeywords: [],
          publishStatus: "DRAFT",
        },
        select: { id: true },
      });
      convertedId = created.id;
      convertedType = "University";
      adminPath = `/admin/universities/${created.id}/edit`;
      break;
    }

    case "COUNTRY": {
      // The ISO alpha-2 code is part of this site's URLs and filters, so it has
      // to come from a person who can verify it rather than being invented here.
      const code = (countryCode ?? "").trim().toUpperCase();
      if (!/^[A-Z]{2}$/.test(code)) {
        return { error: "Enter the country's two-letter ISO code to convert this submission." };
      }
      const taken = await prisma.country.findUnique({ where: { code }, select: { id: true } });
      if (taken) {
        return { error: `A country with the code ${code} already exists. Merge this submission into it instead.` };
      }

      const created = await prisma.country.create({
        data: {
          name: title,
          slug,
          code,
          description,
          region: "Unassigned",
          officialLanguages: [],
          popularUniversities: [],
          popularFields: [],
          seoKeywords: [],
          publishStatus: "DRAFT",
        },
        select: { id: true },
      });
      convertedId = created.id;
      convertedType = "Country";
      adminPath = `/admin/countries/${created.id}/edit`;
      break;
    }

    case "FIELD": {
      const created = await prisma.field.create({
        data: {
          name: title,
          slug,
          description,
          popularDegrees: [],
          careerPaths: [],
          seoKeywords: [],
          publishStatus: "DRAFT",
        },
        select: { id: true },
      });
      convertedId = created.id;
      convertedType = "Field";
      adminPath = `/admin/fields/${created.id}/edit`;
      break;
    }

    case "RESOURCE": {
      const created = await prisma.resource.create({
        data: {
          title,
          slug,
          description,
          url,
          type: url ? "LINK" : "GUIDE",
          tags: [],
          seoKeywords: [],
          publishStatus: "DRAFT",
        },
        select: { id: true },
      });
      convertedId = created.id;
      convertedType = "Resource";
      adminPath = `/admin/resources/${created.id}/edit`;
      break;
    }

    default: {
      // CORRECTION has no record of its own: the reviewer applies the fix to the
      // existing record and links it in the internal notes.
      return {
        error:
          "A correction is applied to an existing record. Note what needs changing in the internal notes, then close the submission.",
      };
    }
  }

  await prisma.submission.update({
    where: { id },
    data: { convertedId, convertedType, status: "APPROVED", reviewedAt: new Date(), reviewedById: actor.id },
  });

  await recordActivity({
    action: "submission.convert",
    entityType: "Submission",
    entityId: id,
    summary: `Converted a submission into a draft ${convertedType?.toLowerCase()}: ${title}`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/submissions");
  return { adminPath };
}

export type SubmissionBulkAction = "under_review" | "approved" | "rejected" | "pending" | "trash";

const BULK_STATUS: Record<string, "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED"> = {
  pending: "PENDING",
  under_review: "UNDER_REVIEW",
  approved: "APPROVED",
  rejected: "REJECTED",
};

export async function bulkSubmissionAction(
  ids: string[],
  action: SubmissionBulkAction
): Promise<{ error?: string; affected?: number }> {
  let actor: SessionUser;
  try {
    if (action === "trash") actor = await requireAdmin();
    else actor = await requireReviewer();
  } catch (error) {
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return { error: "Select at least one submission." };

  const data =
    action === "trash"
      ? { deletedAt: new Date() }
      : { status: BULK_STATUS[action], reviewedById: actor.id, reviewedAt: new Date() };

  const result = await prisma.submission.updateMany({ where: { id: { in: unique } }, data });

  await recordActivity({
    action: `submission.bulk_${action}`,
    entityType: "Submission",
    entityId: null,
    summary: `Applied "${action.replace("_", " ")}" to ${result.count} submission${
      result.count === 1 ? "" : "s"
    }`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/dashboard");
  return { affected: result.count };
}
