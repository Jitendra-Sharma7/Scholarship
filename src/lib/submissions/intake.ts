import { prisma } from "@/lib/prisma";
import {
  submissionFieldErrors,
  submissionSchema,
  type SubmissionInput,
} from "@/lib/validations/submission";

/**
 * Community submission intake.
 *
 * Shared by the public JSON route and the server action the submission form
 * uses, so both apply identical rules. Duplicating this would let the two entry
 * points drift, and the rules that matter are exactly the ones a duplicate
 * implementation gets wrong: the throttle, the single-open-submission check, and
 * the rule that a submitted claim is never treated as verified content.
 *
 * A submission is an unverified claim from the public. It is stored as `PENDING`
 * and only ever surfaces in the admin inbox; nothing sent here can reach the
 * public site without a human reviewing it.
 */

export type IntakeResult =
  | { ok: true; id: string; message: string }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string>; retryAfter?: number };

/** Submissions accepted from one connection per hour. */
export const MAX_SUBMISSIONS_PER_HOUR = 5;

export async function acceptSubmission(
  body: unknown,
  options: { throttle: () => Promise<{ allowed: boolean; retryAfter: number }> }
): Promise<IntakeResult> {
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      error: "Some details need fixing.",
      fieldErrors: submissionFieldErrors(parsed.error),
    };
  }

  const data: SubmissionInput = parsed.data;

  // One open submission per email at a time: a repeat submission is almost
  // always a double submit rather than a second, distinct claim.
  const openByEmail = await prisma.submission.findFirst({
    where: {
      submitterEmail: data.submitterEmail,
      status: { in: ["PENDING", "UNDER_REVIEW"] },
      deletedAt: null,
    },
    select: { id: true },
  });
  if (openByEmail) {
    return {
      ok: false,
      status: 409,
      error: "You already have a submission awaiting review. We will be in touch.",
    };
  }

  // Prevent duplicate submissions of the same scholarship
  const existingScholarship = await prisma.scholarship.findFirst({
    where: {
      OR: [
        { officialUrl: data.officialUrl },
        { title: { equals: data.title, mode: 'insensitive' } }
      ],
      deletedAt: null
    },
    select: { id: true }
  });

  if (existingScholarship) {
    return {
      ok: false,
      status: 409,
      error: "This scholarship is already in our database. Thank you!",
    };
  }

  // The throttle runs only once the submission is otherwise acceptable, so the
  // budget it protects is spent on stored records. Charging it before
  // validation would mean a visitor who mistypes an email address is told to
  // come back in an hour, having submitted nothing at all.
  const limit = await options.throttle();
  if (!limit.allowed) {
    return {
      ok: false,
      status: 429,
      error: "Too many submissions from this connection. Please try again later.",
      retryAfter: limit.retryAfter,
    };
  }

  const created = await prisma.submission.create({
    data: {
      type: data.type,
      status: "PENDING",
      submitterName: data.submitterName,
      submitterEmail: data.submitterEmail,
      payload: {
        title: data.title,
        description: data.description,
        officialUrl: data.officialUrl,
        countryName: data.countryName,
        deadline: data.deadline ? data.deadline.toISOString() : null,
        fundingAmount: data.fundingAmount,
        currency: data.currency,
        degreeLevels: data.degreeLevels,
      },
    },
    select: { id: true },
  });

  return {
    ok: true,
    id: created.id,
    message: "Thank you. Your submission is awaiting review.",
  };
}
