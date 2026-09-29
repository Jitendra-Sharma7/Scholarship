import { z } from "zod";
import { SUBMISSION_TYPES } from "@/lib/submissions/vocabulary";

/**
 * Validation for community submissions.
 *
 * The schema itself is server-only: it is imported by the intake action, and
 * nothing a browser runs may depend on it. The vocabulary the forms need - the
 * allowed values and their labels - lives in `lib/submissions/vocabulary.ts`,
 * which holds no schema, so a client component can import a label without
 * pulling zod into the browser bundle.
 *
 * A submission is a claim made by a member of the public, not verified content.
 * The schema therefore records what was sent and nothing more: the admin review
 * step is what turns a submission into a published record.
 */

/** Free-text detail shared by every submission type. */
const detail = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : null));

/** The official source an admin must check before anything is published. */
const sourceUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/[^\s]+$/.test(v), "Enter a full URL starting with http")
  .optional()
  .transform((v) => (v ? v : null));

export const submitterSchema = z.object({
  submitterName: z.string().trim().min(2, "Enter your name").max(120),
  submitterEmail: z
    .string()
    .trim()
    .min(5, "Enter your email address")
    .max(200)
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email address"),
});

export const submissionSchema = submitterSchema.extend({
  type: z.enum(SUBMISSION_TYPES),
  title: z.string().trim().min(3, "Give the scholarship, university or page a name").max(300),
  description: detail,
  officialUrl: sourceUrl,
  /** Destination country, recorded as a name because the submitter picks it from a list. */
  countryName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : null)),
  // Scholarship-specific, all optional: a submitter often knows only some of it.
  deadline: z
    .string()
    .trim()
    .refine((v) => v === "" || !Number.isNaN(new Date(v).getTime()), "Enter a valid date")
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  fundingAmount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined || v === null) return null;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) && n >= 0 ? n : null;
    }),
  currency: z.string().trim().max(10).optional().transform((v) => (v ? v.toUpperCase() : null)),
  degreeLevels: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      const list = Array.isArray(v) ? v : (v ?? "").split(/[,\n]/);
      return list.map((s) => String(s).trim()).filter(Boolean).slice(0, 20);
    }),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;

/** Flattens issues into `{ field: message }` for inline form errors. */
export function submissionFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
