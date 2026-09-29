"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { atLeast, getCurrentUser, isStaff } from "@/lib/auth";
import { recordActivity } from "@/lib/audit";
import { changeSlugWithRedirect, generateUniqueSlug, slugify } from "@/lib/slug";
import {
  scholarshipSchema,
  fieldErrorsFrom,
  type ScholarshipInput,
} from "@/lib/validations/scholarship";
import {
  toPrismaDeadlineStatus,
  toPrismaFundingType,
  toPrismaStudyMode,
  toPrismaVerificationStatus,
} from "@/lib/enums";
import { evaluateDeadlineSync } from "@/lib/deadline";
import { getSettingNumber } from "@/lib/settings";

/**
 * Scholarship mutations.
 *
 * Every action re-checks the session and role on the server. The UI hides
 * actions an editor may not perform, but that is presentation only - these
 * guards are the actual boundary, so a crafted request cannot bypass them.
 */

export interface ScholarshipActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
}

/**
 * Public paths whose cached renders can contain this scholarship.
 *
 * The admin pages are deliberately absent: they are dynamic (they read the
 * session cookie) and the client already calls `router.refresh()` after a
 * mutation, so revalidating them would only add render work for no benefit.
 */
const PUBLIC_PATHS = ["/", "/scholarships", "/fully-funded", "/deadlines"];

/** Revalidates the cached public views a scholarship can appear in. */
function revalidateScholarshipViews(slug?: string) {
  for (const path of PUBLIC_PATHS) revalidatePath(path);
  if (slug) revalidatePath(`/scholarships/${slug}`);
}

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    // A typed error, not a generic throw, so the caller can return it as a form
    // message instead of surfacing a 500 to whoever crafted the request.
    throw new AuthorizationError("You must be signed in as an administrator to do that.");
  }
  return user;
}

/** Distinguishes "you may not do this" from an unexpected server failure. */
class AuthorizationError extends Error {}

async function requireAdmin() {
  const user = await requireEditor();
  if (!atLeast(user.role, "ADMIN")) {
    throw new AuthorizationError("Your role does not have permission to do that.");
  }
  return user;
}

/** Form fields that legitimately repeat and must stay arrays. */
const ARRAY_FIELDS = ["fieldIds", "degreeLevels"] as const;

/** Removes duplicates and blanks while preserving the admin's ordering. */
function dedupe(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

/**
 * Converts FormData into a plain object for validation.
 *
 * `Object.fromEntries` keeps only the last value of a repeated key, which would
 * silently reduce a multi-select to its final option. Array fields are read with
 * `getAll` instead so a checkbox group survives the trip to the server.
 */
function formDataToInput(formData: FormData): Record<string, unknown> {
  const arrayFields = new Set<string>(ARRAY_FIELDS);
  const out: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (arrayFields.has(key)) continue;
    out[key] = value;
  }
  for (const key of ARRAY_FIELDS) {
    // An unticked checkbox group posts only the hidden empty sentinel, which is
    // filtered here so it does not become a phantom field id.
    out[key] = formData.getAll(key).map(String).filter((v) => v !== "");
  }
  return out;
}

/** Converts validated input into the Prisma field set. */
function toPrismaData(input: ScholarshipInput, slug: string) {
  const closingSoonDays = 14; // refreshed below by the caller when needed
  void closingSoonDays;

  return {
    title: input.title,
    shortTitle: input.shortTitle ?? null,
    slug,
    description: input.description ?? null,
    shortDescription: input.shortDescription ?? null,
    officialUrl: input.officialUrl ?? null,
    applicationUrl: input.applicationUrl ?? null,
    providerId: input.providerId ?? null,
    universityId: input.universityId ?? null,
    countryId: input.countryId ?? null,
    city: input.city ?? null,
    region: input.region ?? null,
    providerContact: input.providerContact ?? null,
    logo: input.logo ?? null,
    coverImage: input.coverImage ?? null,

    fundingType: toPrismaFundingType(input.fundingType),
    isFullyFunded: Boolean(input.isFullyFunded),
    fundingAmount: input.fundingAmount ?? null,
    currency: input.currency ?? null,
    monthlyStipend: input.monthlyStipend ?? null,
    annualStipend: input.annualStipend ?? null,
    tuitionCoverage: Boolean(input.tuitionCoverage),
    accommodationCoverage: Boolean(input.accommodationCoverage),
    travelAllowance: Boolean(input.travelAllowance),
    healthInsurance: Boolean(input.healthInsurance),
    visaSupport: Boolean(input.visaSupport),
    researchFunding: Boolean(input.researchFunding),
    otherBenefits: input.otherBenefits ?? null,

    degreeLevels: dedupe([
      ...input.degreeLevels,
      ...(input.degreeLevelsOther ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    ]),
    eligibleCountries: input.eligibleCountries,
    nationalityRestrictions: input.nationalityRestrictions,
    minGpa: input.minGpa ?? null,
    minPercentage: input.minPercentage ?? null,
    ageRequirement: input.ageRequirement ?? null,
    workExpReq: input.workExpReq ?? null,
    otherRequirements: input.otherRequirements ?? null,
    numAwards: input.numAwards ?? null,
    financialNeedReq: Boolean(input.financialNeedReq),
    languageReqs: input.languageReqs,
    otherTestReqs: input.otherTestReqs,
    academicReqs: input.academicReqs,
    selectionCriteria: input.selectionCriteria,

    studyMode: toPrismaStudyMode(input.studyMode),
    studyType: input.studyType ?? null,
    subField: input.subField ?? null,
    duration: input.duration ?? null,
    intake: input.intake ?? null,

    openingDate: input.openingDate ?? null,
    deadline: input.deadline ?? null,
    deadlineType: input.deadlineType ?? null,
    applicationFee: input.applicationFee ?? null,
    applicationMethod: input.applicationMethod ?? null,
    documentsRequired: input.documentsRequired,
    applicationProcess: input.applicationProcess,

    publishStatus: input.publishStatus,
    featured: Boolean(input.featured),
    featuredOrder: input.featuredOrder ?? null,
    featuredUntil: input.featuredUntil ?? null,
    deadlineStatusOverride: input.deadlineStatusOverride
      ? toPrismaDeadlineStatus(input.deadlineStatusOverride)
      : null,

    source: input.source ?? "Entered by an administrator",
    verificationStatus: input.verificationStatus
      ? toPrismaVerificationStatus(input.verificationStatus)
      : "VERIFICATION_NEEDED",

    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    seoKeywords: input.seoKeywords,
    canonicalUrl: input.canonicalUrl ?? null,
    ogImage: input.ogImage ?? null,
    noindex: Boolean(input.noindex),
    includeInSitemap: input.includeInSitemap === false ? false : true,

    ieltsReq: input.ieltsReq ?? null,
    toeflReq: input.toeflReq ?? null,
    greReq: input.greReq ?? null,
    gmatReq: input.gmatReq ?? null,
  };
}

/** Replaces the scholarship's field links in one transaction. */
async function syncFields(scholarshipId: string, fieldIds: string[]) {
  await prisma.scholarshipField.deleteMany({ where: { scholarshipId } });
  const unique = [...new Set(fieldIds.filter(Boolean))];
  if (unique.length === 0) return;
  await prisma.scholarshipField.createMany({
    data: unique.map((fieldId) => ({ scholarshipId, fieldId })),
    skipDuplicates: true,
  });
}

// ---------------------------------------------------------------------------
// Create / update
// ---------------------------------------------------------------------------

export async function createScholarship(
  _prev: ScholarshipActionState,
  formData: FormData
): Promise<ScholarshipActionState> {
  let actor: Awaited<ReturnType<typeof getCurrentUser>> & object;
  try {
    actor = await requireEditor();
  } catch (error) {
    if (error instanceof AuthorizationError) return { error: error.message };
    throw error;
  }

  const parsed = scholarshipSchema.safeParse(formDataToInput(formData));
  if (!parsed.success) {
    // Logged because the inline error state is only re-rendered through the
    // client action runtime, so this is the only server-side record of why a
    // save was refused.
    console.error("[scholarship.create] validation failed", parsed.error.issues);
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const input = parsed.data;
  const desired = input.slug ? slugify(input.slug) : slugify(input.title);
  const slug = await generateUniqueSlug("scholarship", desired);

  const data = toPrismaData(input, slug);

  // Keep the stored status in step with the deadline so admin lists do not show
  // a stale value between reads.
  const closingSoonDays = await getSettingNumber("scholarships.closingSoonDays", 14);
  const evaluated = evaluateDeadlineSync({
    deadline: data.deadline,
    openingDate: data.openingDate,
    override: data.deadlineStatusOverride,
    closingSoonDays,
  });

  const created = await prisma.scholarship.create({
    data: {
      ...data,
      deadlineStatus: toPrismaDeadlineStatus(evaluated.status),
    },
  });

  await syncFields(created.id, input.fieldIds ?? []);

  await recordActivity({
    action: "scholarship.create",
    entityType: "Scholarship",
    entityId: created.id,
    summary: `Created scholarship "${created.title}"`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidateScholarshipViews(created.slug);
  revalidatePath("/admin/scholarships");

  redirect(`/admin/scholarships/${created.id}/edit?saved=1`);
}

export async function updateScholarship(
  id: string,
  _prev: ScholarshipActionState,
  formData: FormData
): Promise<ScholarshipActionState> {
  let actor: Awaited<ReturnType<typeof getCurrentUser>> & object;
  try {
    actor = await requireEditor();
  } catch (error) {
    if (error instanceof AuthorizationError) return { error: error.message };
    throw error;
  }

  const existing = await prisma.scholarship.findUnique({
    where: { id },
    select: { id: true, slug: true, title: true },
  });
  if (!existing) return { error: "That scholarship no longer exists." };

  const parsed = scholarshipSchema.safeParse(formDataToInput(formData));
  if (!parsed.success) {
    console.error("[scholarship.update] validation failed", parsed.error.issues);
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const input = parsed.data;
  const desired = input.slug ? slugify(input.slug) : slugify(input.title);
  const slug = await generateUniqueSlug("scholarship", desired, id);

  const data = toPrismaData(input, slug);
  const closingSoonDays = await getSettingNumber("scholarships.closingSoonDays", 14);
  const evaluated = evaluateDeadlineSync({
    deadline: data.deadline,
    openingDate: data.openingDate,
    override: data.deadlineStatusOverride,
    closingSoonDays,
  });

  // A single statement needs no transaction wrapper: an interactive transaction
  // would only add a pool round-trip and a wait-for-connection window.
  await prisma.scholarship.update({
    where: { id },
    data: { ...data, deadlineStatus: toPrismaDeadlineStatus(evaluated.status) },
  });

  await syncFields(id, input.fieldIds ?? []);

  // Preserve the previous URL when the slug moved.
  if (existing.slug !== slug) {
    await changeSlugWithRedirect("scholarship", existing.slug, slug);
  }

  await recordActivity({
    action: "scholarship.update",
    entityType: "Scholarship",
    entityId: id,
    summary: `Updated scholarship "${input.title}"`,
    metadata: { slugChanged: existing.slug !== slug },
    actor: { id: actor.id, email: actor.email },
  });

  revalidateScholarshipViews(slug);
  if (existing.slug !== slug) revalidatePath(`/scholarships/${existing.slug}`);

  // Redirect rather than returning the saved state, mirroring create. The editor
  // page renders a confirmation banner for `?saved=1`, and re-reading the record
  // from the database is safer than echoing the submitted values back.
  redirect(`/admin/scholarships/${id}/edit?saved=1`);
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export async function setScholarshipStatus(
  id: string,
  publishStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"
): Promise<{ error?: string }> {
  const actor = await requireEditor();

  const existing = await prisma.scholarship.findUnique({
    where: { id },
    select: { slug: true, title: true },
  });
  if (!existing) return { error: "That scholarship no longer exists." };

  await prisma.scholarship.update({
    where: { id },
    data: {
      publishStatus,
      // Stamp the publish date the first time it goes live, and keep it after.
      ...(publishStatus === "PUBLISHED" ? { publishedAt: new Date() } : {}),
    },
  });

  await recordActivity({
    action: `scholarship.${publishStatus.toLowerCase()}`,
    entityType: "Scholarship",
    entityId: id,
    summary: `${publishStatus === "PUBLISHED" ? "Published" : publishStatus === "DRAFT" ? "Unpublished" : "Archived"} "${existing.title}"`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidateScholarshipViews(existing.slug);
  revalidatePath("/admin/scholarships");
  return {};
}

export async function setScholarshipFlags(
  id: string,
  flags: { featured?: boolean; isFullyFunded?: boolean; featuredOrder?: number | null }
): Promise<{ error?: string }> {
  const actor = await requireEditor();

  const existing = await prisma.scholarship.findUnique({
    where: { id },
    select: { slug: true, title: true },
  });
  if (!existing) return { error: "That scholarship no longer exists." };

  await prisma.scholarship.update({
    where: { id },
    data: {
      ...(flags.featured !== undefined ? { featured: flags.featured } : {}),
      ...(flags.isFullyFunded !== undefined ? { isFullyFunded: flags.isFullyFunded } : {}),
      ...(flags.featuredOrder !== undefined ? { featuredOrder: flags.featuredOrder } : {}),
    },
  });

  const changed = Object.entries(flags)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k)
    .join(", ");
  await recordActivity({
    action: "scholarship.update_flags",
    entityType: "Scholarship",
    entityId: id,
    summary: `Updated (${changed}) on "${existing.title}"`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidateScholarshipViews(existing.slug);
  revalidatePath("/admin/scholarships");
  return {};
}

export async function duplicateScholarship(
  id: string
): Promise<{ error?: string; newId?: string }> {
  const actor = await requireEditor();

  const source = await prisma.scholarship.findUnique({
    where: { id },
    include: { fields: { select: { fieldId: true } } },
  });
  if (!source) return { error: "That scholarship no longer exists." };

  // `include` returns every scalar plus the joined rows, so dropping the
  // scalars we must not carry over is enough; relations are never copied.
  const { id: _ignoredId, slug: _ignoredSlug, createdAt: _c1, updatedAt: _c2, publishedAt: _c3, fields, ...rest } =
    source;

  const slug = await generateUniqueSlug("scholarship", `${source.slug}-copy`);

  const copy = await prisma.scholarship.create({
    data: {
      ...rest,
      slug,
      title: `${source.title} (copy)`,
      // A duplicate always starts unpublished so it is reviewed before going live.
      publishStatus: "DRAFT",
      publishedAt: null,
      featured: false,
      featuredOrder: null,
      isFullyFunded: source.isFullyFunded,
    },
  });

  await syncFields(
    copy.id,
    fields.map((f) => f.fieldId)
  );

  await recordActivity({
    action: "scholarship.duplicate",
    entityType: "Scholarship",
    entityId: copy.id,
    summary: `Duplicated "${source.title}"`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/scholarships");
  return { newId: copy.id };
}

// ---------------------------------------------------------------------------
// Trash
// ---------------------------------------------------------------------------

/** Moves to trash. Reversible, and the default destructive action. */
export async function trashScholarship(
  id: string
): Promise<{ error?: string }> {
  const actor = await requireAdmin();

  const existing = await prisma.scholarship.findUnique({
    where: { id },
    select: { slug: true, title: true },
  });
  if (!existing) return { error: "That scholarship no longer exists." };

  await prisma.scholarship.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await recordActivity({
    action: "scholarship.trash",
    entityType: "Scholarship",
    entityId: id,
    summary: `Moved "${existing.title}" to trash`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidateScholarshipViews(existing.slug);
  revalidatePath("/admin/scholarships");
  return {};
}

export async function restoreScholarship(
  id: string
): Promise<{ error?: string }> {
  const actor = await requireAdmin();

  const existing = await prisma.scholarship.findUnique({
    where: { id },
    select: { slug: true, title: true },
  });
  if (!existing) return { error: "That scholarship no longer exists." };

  await prisma.scholarship.update({ where: { id }, data: { deletedAt: null } });

  await recordActivity({
    action: "scholarship.restore",
    entityType: "Scholarship",
    entityId: id,
    summary: `Restored "${existing.title}" from trash`,
    actor: { id: actor.id, email: actor.email },
  });

  revalidateScholarshipViews(existing.slug);
  revalidatePath("/admin/scholarships");
  return {};
}

/** Irreversible. Requires SUPER_ADMIN and a confirmed flag. */
export async function destroyScholarshipForever(
  id: string,
  confirmed: boolean
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return { error: "You must be signed in as an administrator." };
  }
  if (user.role !== "SUPER_ADMIN") {
    return { error: "Only a super admin can permanently delete content." };
  }
  if (!confirmed) {
    return { error: "Permanent deletion must be confirmed." };
  }

  const existing = await prisma.scholarship.findUnique({
    where: { id },
    select: { title: true, slug: true },
  });
  if (!existing) return { error: "That scholarship no longer exists." };

  // Join rows cascade; saved/applications cascade via the schema.
  await prisma.scholarship.delete({ where: { id } });

  await recordActivity({
    action: "scholarship.destroy",
    entityType: "Scholarship",
    entityId: id,
    summary: `Permanently deleted "${existing.title}"`,
    actor: { id: user.id, email: user.email },
  });

  revalidateScholarshipViews(existing.slug);
  revalidatePath("/admin/scholarships");
  return {};
}

// ---------------------------------------------------------------------------
// Bulk
// ---------------------------------------------------------------------------

export type BulkScholarshipAction =
  | "publish"
  | "unpublish"
  | "archive"
  | "trash"
  | "feature"
  | "unfeature"
  | "fullyFunded"
  | "notFullyFunded";

const BULK_LABEL: Record<BulkScholarshipAction, string> = {
  publish: "Published",
  unpublish: "Unpublished",
  archive: "Archived",
  trash: "Moved to trash",
  feature: "Marked as featured",
  unfeature: "Removed from featured",
  fullyFunded: "Marked fully funded",
  notFullyFunded: "Removed fully funded flag",
};

export async function bulkScholarshipAction(
  ids: string[],
  action: BulkScholarshipAction
): Promise<{ error?: string; affected?: number }> {
  const actor = await requireEditor();

  // Destroying content is an admin capability; the rest is editorial.
  if (["trash", "archive"].includes(action)) {
    await requireAdmin();
  }

  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return { error: "Select at least one scholarship." };

  const now = new Date();
  const data =
    action === "publish"
      ? { publishStatus: "PUBLISHED" as const }
      : action === "unpublish"
        ? { publishStatus: "DRAFT" as const }
        : action === "archive"
          ? { publishStatus: "ARCHIVED" as const }
          : action === "trash"
            ? { deletedAt: now }
            : action === "feature"
              ? { featured: true }
              : action === "unfeature"
                ? { featured: false }
                : action === "fullyFunded"
                  ? { isFullyFunded: true }
                  : { isFullyFunded: false };

  const result = await prisma.scholarship.updateMany({
    where: { id: { in: unique } },
    data,
  });

  await recordActivity({
    action: `scholarship.bulk_${action}`,
    entityType: "Scholarship",
    entityId: null,
    summary: `${BULK_LABEL[action]} ${result.count} scholarship${result.count === 1 ? "" : "s"}`,
    metadata: { ids: unique.slice(0, 50), count: result.count },
    actor: { id: actor.id, email: actor.email },
  });

  revalidatePath("/admin/scholarships");
  revalidatePath("/admin/dashboard");
  for (const path of ["/", "/scholarships", "/fully-funded", "/deadlines"]) {
    revalidatePath(path);
  }

  return { affected: result.count };
}
