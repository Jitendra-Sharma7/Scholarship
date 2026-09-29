import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { MAX_SUBMISSIONS_PER_HOUR, acceptSubmission } from "@/lib/submissions/intake";

/**
 * Public intake for community submissions, as JSON.
 *
 * The site's own form uses the `submitScholarship` server action instead, so the
 * browser never posts here. This route remains for external submitters and for
 * the verification scripts, and shares the rules in `lib/submissions/intake`.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const result = await acceptSubmission(body, {
    throttle: () => rateLimit("submission", MAX_SUBMISSIONS_PER_HOUR),
  });

  if (!result.ok) {
    const headers: Record<string, string> = {};
    if (result.retryAfter) headers["Retry-After"] = String(result.retryAfter);
    return NextResponse.json(
      { error: result.error, fieldErrors: result.fieldErrors },
      { status: result.status, headers }
    );
  }

  return NextResponse.json({ ok: true, id: result.id, message: result.message }, { status: 201 });
}
