import type { PublicScholarship } from "./public";
import { getPublicScholarships } from "./public";

/**
 * Eligibility matching, computed on the server.
 *
 * Server code only. A client component must not pull this module: it reads the
 * database, and a browser bundle has no business carrying that. The finder page
 * calls `runEligibilityMatch` in `app/actions/public-actions.ts` instead.
 *
 * The read-only `/api/public/*` routes exist for external consumers and the
 * verification scripts. Nothing inside `src/app` or `src/components` calls
 * them.
 */

/** Profile shape consumed by the matching engine. */
export interface MatchProfile {
  degreeLevel?: string;
  field?: string;
  citizenship?: string;
  targetCountries?: string[];
  gpa?: number | string | null;
  languageScore?: string;
  needFullFunding?: boolean;
  startYear?: string;
  experience?: string;
  priority?: string;
}

export interface MatchResult {
  scholarship: PublicScholarship;
  score: number;
  reasons: string[];
  missing?: string[];
  warnings?: string[];
}

/**
 * Eligibility matching.
 *
 * Scores each published scholarship against the profile. Kept deliberately
 * explainable: every point comes with a reason, a gap, or a warning, so the UI
 * can show why something did or did not match rather than an opaque score.
 */
export async function findMatches(userProfile: MatchProfile): Promise<MatchResult[]> {
  // Pull a broad set, then score locally. Bounded so the page stays quick.
  const { data } = await getPublicScholarships({ limit: 60, sort: "deadline" });

  const results = data.map((scholarship) => {
    let score = 0;
    const reasons: string[] = [];
    const missing: string[] = [];
    const warnings: string[] = [];

    // 1. Degree level (critical)
    if (userProfile.degreeLevel) {
      if (scholarship.degreeLevels.includes(userProfile.degreeLevel)) {
        score += 35;
        reasons.push(`Degree level matches (${userProfile.degreeLevel})`);
      } else {
        warnings.push(
          `You are looking for ${userProfile.degreeLevel} but this is for ${scholarship.degreeLevels.join(", ") || "other levels"}`
        );
      }
    }

    // 2. Field of study (critical)
    if (userProfile.field) {
      const openToAll = scholarship.fields.some(
        (f) => f === "All" || f.toLowerCase().startsWith("all ")
      );
      if (openToAll) {
        score += 25;
        reasons.push("Open to all fields of study");
      } else if (scholarship.fields.includes(userProfile.field)) {
        score += 30;
        reasons.push(`Field of study matches (${userProfile.field})`);
      } else {
        warnings.push(`Not specifically for ${userProfile.field}`);
      }
    }

    // 3. Destination preference
    if (
      userProfile.targetCountries &&
      userProfile.targetCountries.length > 0 &&
      scholarship.countryId &&
      userProfile.targetCountries.includes(scholarship.countryId)
    ) {
      score += 15;
      reasons.push("Destination country matches your preference");
    }

    // 4. GPA. The form collects GPA as text, so normalise before comparing.
    const profileGpa =
      typeof userProfile.gpa === "number"
        ? userProfile.gpa
        : Number.parseFloat(String(userProfile.gpa ?? ""));
    const hasProfileGpa = Number.isFinite(profileGpa) && profileGpa > 0;

    if (hasProfileGpa && scholarship.minGpa) {
      if (profileGpa >= scholarship.minGpa) {
        score += 10;
        reasons.push(
          `Your GPA (${profileGpa}) meets the requirement (${scholarship.minGpa})`
        );
      } else {
        warnings.push(`Your GPA (${profileGpa}) is below the requirement (${scholarship.minGpa})`);
        score -= 20;
      }
    } else if (scholarship.minGpa && !userProfile.gpa) {
      missing.push(`Requires minimum GPA of ${scholarship.minGpa}`);
    }

    // 5. Funding
    if (userProfile.needFullFunding) {
      if (scholarship.isFullyFunded || scholarship.fundingType === "fully-funded") {
        score += 15;
        reasons.push("Provides the full funding you requested");
      } else {
        warnings.push(`Does not provide full funding (it is ${scholarship.fundingType})`);
        score -= 10;
      }
    }

    return {
      scholarship,
      score: Math.max(0, Math.min(100, score)),
      reasons,
      missing,
      warnings,
    };
  });

  return results
    .filter((r) => r.score > 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
