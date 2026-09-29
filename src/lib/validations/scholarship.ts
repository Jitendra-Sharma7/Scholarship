import { z } from "zod";

import {
  FUNDING_TYPES,
  DEADLINE_STATUSES,
  SUGGESTED_DEGREE_LEVELS,
  VERIFICATION_STATUSES,
} from "@/lib/enums";

/**
 * Server-side validation for the scholarship editor.
 *
 * The same schema runs on the client for inline errors and again on the server
 * before anything is written, so a hand-crafted request cannot bypass it.
 */

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) => value === "" || /^https?:\/\/[^\s]+$/i.test(value),
    "Must be a valid http(s) URL"
  )
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

const optionalText = z
  .string()
  .trim()
  .max(200)
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

const longText = z.string().trim().max(20000).nullable().optional();

const dateField = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(new Date(value).getTime()), "Invalid date")
  .transform((value) => (value === "" ? null : new Date(value)))
  .nullable()
  .optional();

const numberField = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined || value === "") return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  });

/** Splits a textarea/comma list into a clean, de-duplicated string array. */
const stringList = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
  )
  .pipe(z.array(z.string().max(300)).max(200));

export const scholarshipSchema = z
  .object({
    // Basic
    title: z.string().trim().min(3, "Title is required").max(300),
    shortTitle: optionalText,
    slug: z
      .string()
      .trim()
      .max(90)
      .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and hyphens only")
      .optional()
      .or(z.literal("")),
    description: z.string().trim().max(20000).optional().nullable(),
    shortDescription: z
      .string()
      .trim()
      .max(400, "Keep the summary under 400 characters")
      .optional()
      .nullable(),
    officialUrl: optionalUrl,
    applicationUrl: optionalUrl,
    providerId: optionalText,
    universityId: optionalText,
    countryId: optionalText,
    city: optionalText,
    region: optionalText,
    providerContact: optionalText,
    logo: optionalText,
    coverImage: optionalText,

    // Funding
    fundingType: z.enum(FUNDING_TYPES as unknown as [string, ...string[]]),
    isFullyFunded: z.coerce.boolean().optional(),
    fundingAmount: numberField,
    currency: optionalText,
    monthlyStipend: numberField,
    annualStipend: numberField,
    tuitionCoverage: z.coerce.boolean().optional(),
    accommodationCoverage: z.coerce.boolean().optional(),
    travelAllowance: z.coerce.boolean().optional(),
    healthInsurance: z.coerce.boolean().optional(),
    visaSupport: z.coerce.boolean().optional(),
    researchFunding: z.coerce.boolean().optional(),
    otherBenefits: longText,

    // Eligibility
    // The editor offers standard levels as a checkbox group and everything else
    // in a free-text box, so this arrives either as repeated values or as a
    // single comma-separated string. Both are normalised to an array, and an
    // absent value means "not specified" rather than an error.
    degreeLevels: z
      .union([z.array(z.string().max(60)), z.string()])
      .optional()
      .transform((value) => {
        if (value === undefined) return [];
        return (Array.isArray(value) ? value : value.split(","))
          .map((s) => s.trim())
          .filter(Boolean);
      })
      .pipe(z.array(z.string().max(60)).max(20)),
    /** Extra levels typed by hand; merged with `degreeLevels` on the server. */
    degreeLevelsOther: z.string().trim().max(400).optional().nullable(),
    eligibleCountries: stringList,
    nationalityRestrictions: stringList,
    minGpa: numberField,
    minPercentage: numberField,
    ageRequirement: numberField,
    englishRequirement: optionalText,
    ieltsReq: numberField,
    toeflReq: numberField,
    greReq: numberField,
    gmatReq: numberField,
    otherRequirements: longText,
    workExpReq: z.string().trim().max(2000).optional().nullable(),
    numAwards: numberField,
    financialNeedReq: z.coerce.boolean().optional(),
    languageReqs: stringList,
    otherTestReqs: stringList,
    academicReqs: stringList,
    selectionCriteria: stringList,

    // Academic
    studyMode: optionalText,
    studyType: optionalText,
    subField: optionalText,
    duration: optionalText,
    intake: optionalText,
    programType: optionalText,

    // Application
    openingDate: dateField,
    deadline: dateField,
    deadlineType: optionalText,
    applicationFee: numberField,
    applicationMethod: optionalText,
    documentsRequired: stringList,
    applicationProcess: stringList,

    // Visibility
    publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    featured: z.coerce.boolean().optional(),
    featuredOrder: numberField,
    featuredUntil: dateField,
    // Empty string means "calculate it automatically".
    deadlineStatusOverride: z
      .string()
      .optional()
      .transform((value) => (value === "" ? null : value))
      .refine(
        (value) => value == null || (DEADLINE_STATUSES as readonly string[]).includes(value),
        "Unknown status"
      ),

    // Verification
    source: z.string().trim().max(300).optional().nullable(),
    verificationStatus: z
      .enum(VERIFICATION_STATUSES as unknown as [string, ...string[]])
      .optional(),

    // SEO
    seoTitle: z.string().trim().max(70, "Keep the SEO title under 70 characters").optional().nullable(),
    seoDescription: z
      .string()
      .trim()
      .max(180, "Keep the meta description under 180 characters")
      .optional()
      .nullable(),
    seoKeywords: stringList,
    canonicalUrl: optionalUrl,
    ogImage: optionalText,
    noindex: z.coerce.boolean().optional(),
    includeInSitemap: z.coerce.boolean().optional(),

    // Relations
    fieldIds: z.array(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    // A scholarship with no deadline cannot be applied to, so require one
    // unless the admin has deliberately overridden the derived status.
    if (!value.deadline && !value.deadlineStatusOverride) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadline"],
        message: "A deadline is required so the public status can be calculated",
      });
    }
    if (
      value.openingDate &&
      value.deadline &&
      new Date(value.openingDate).getTime() > new Date(value.deadline).getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["openingDate"],
        message: "The opening date must be before the deadline",
      });
    }
  });

export type ScholarshipInput = z.infer<typeof scholarshipSchema>;

/** Degree levels offered as suggestions; free text is still accepted. */
export { SUGGESTED_DEGREE_LEVELS };

/** Flattens Zod issues into `{ field: message }` for inline form errors. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    // Keep the first message per field; it is the most specific one.
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
