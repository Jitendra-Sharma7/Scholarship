/**
 * Submission vocabulary: the allowed values and their display labels.
 *
 * This is deliberately separate from `submission.ts`, which builds the zod
 * schema. The submitter form and the admin inbox are client components that
 * need these labels, and importing them from the schema module pulled the whole
 * of zod - 61 KB before compression - into the browser to read a record of
 * strings. A client component must be able to import a label without inheriting
 * a validation library.
 */

export const SUBMISSION_TYPES = [
  "SCHOLARSHIP",
  "UNIVERSITY",
  "COUNTRY",
  "FIELD",
  "RESOURCE",
  "CORRECTION",
] as const;

export const SUBMISSION_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;

export const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  SCHOLARSHIP: "Scholarship",
  UNIVERSITY: "University",
  COUNTRY: "Country",
  FIELD: "Field of study",
  RESOURCE: "Resource",
  CORRECTION: "Correction",
};

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
