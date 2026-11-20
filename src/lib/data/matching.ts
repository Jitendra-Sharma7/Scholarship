import { prisma } from "@/lib/prisma";
import { evaluateDeadlineSync } from "@/lib/deadline";
import { getSettingNumber } from "@/lib/settings";

interface ScholarshipForMatching {
  id: string;
  title: string;
  country?: { name: string; code: string } | null;
  countryNameLegacy?: string | null;
  university?: { name: string } | null;
  universityNameLegacy?: string | null;
  fields: { field: { name: string } }[];
  fieldLabels: string[];
  degreeLevels: string[];
  eligibleCountries: string[];
  fundingType: string;
  isFullyFunded: boolean;
  minGpa: number | null;
  ieltsReq: number | null;
  toeflReq: number | null;
  deadline: Date | null;
  openingDate: Date | null;
  deadlineStatusOverride: string | null;
}

export interface StudentProfile {
  id: string;
  country?: string | null;
  citizenship?: string | null;
  educationLevel?: string | null;
  currentDegree?: string | null;
  desiredDegree?: string | null;
  fieldOfStudy?: string | null;
  gpa?: number | null;
  ielts?: number | null;
  toefl?: number | null;
  gre?: number | null;
  gmat?: number | null;
  targetCountries?: string[];
  targetUniversities?: string[];
  fundingLevel?: string | null;
  workExp?: string | null;
  researchExp?: string | null;
}

export interface MatchResult {
  scholarshipId: string;
  scholarshipTitle: string;
  universityName: string | null;
  countryName: string | null;
  fundingType: string;
  isFullyFunded: boolean;
  deadline: Date | null;
  matchScore: number;
  matchReasons: string[];
}

export interface MatchProfile {
  degreeLevel?: string;
  field?: string;
  citizenship?: string;
  targetCountries?: string[];
  gpa?: number | null;
  languageScore?: string;
  needFullFunding?: boolean;
  startYear?: string;
  experience?: string;
  priority?: string;
}

function normalizeCountry(country: string): string {
  return country.toLowerCase().trim();
}

function normalizeField(field: string): string {
  return field.toLowerCase().trim();
}

function calculateMatchScore(
  profile: StudentProfile,
  scholarship: ScholarshipForMatching
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Country match (30 points max)
  if (profile.targetCountries && profile.targetCountries.length > 0) {
    const studentCountries = profile.targetCountries.map(normalizeCountry);
    const scholarshipCountry = normalizeCountry(scholarship.country?.name || scholarship.countryNameLegacy || "");
    
    if (studentCountries.includes(scholarshipCountry)) {
      score += 30;
      reasons.push(`Matches your target country: ${scholarship.country?.name || scholarship.countryNameLegacy}`);
    }
  } else if (profile.citizenship) {
    const citizenCountry = normalizeCountry(profile.citizenship);
    const scholarshipCountry = normalizeCountry(scholarship.country?.name || scholarship.countryNameLegacy || "");
    
    if (citizenCountry === scholarshipCountry) {
      score += 20;
      reasons.push(`Available in your country of citizenship`);
    }
  }

  // Eligible countries check (20 points max)
  const eligibleCountries = scholarship.eligibleCountries || [];
  const isOpenToAll = eligibleCountries.some((c: string) => 
    c.toLowerCase().includes("all") || c.toLowerCase().includes("international")
  );
  
  if (isOpenToAll) {
    score += 15;
    reasons.push("Open to all nationalities");
  } else if (profile.citizenship) {
    const citizenLower = profile.citizenship.toLowerCase();
    const isEligible = eligibleCountries.some((c: string) => 
      c.toLowerCase().includes(citizenLower) || citizenLower.includes(c.toLowerCase())
    );
    if (isEligible) {
      score += 20;
      reasons.push(`Your nationality (${profile.citizenship}) is eligible`);
    }
  }

  // Degree level match (20 points max)
  if (profile.desiredDegree || profile.educationLevel) {
    const studentLevel = (profile.desiredDegree || profile.educationLevel || "").toLowerCase();
    const scholarshipLevels = (scholarship.degreeLevels || []).map((l: string) => l.toLowerCase());
    
    const levelMatches = {
      "undergraduate": ["undergraduate", "bachelor", "bachelors"],
      "master": ["master", "masters", "postgraduate", "pg"],
      "phd": ["phd", "doctoral", "doctorate", "ph.d"],
      "postdoctoral": ["postdoctoral", "postdoc", "post-doc"],
    };
    
    for (const [studentKey, synonyms] of Object.entries(levelMatches)) {
      if (studentLevel.includes(studentKey)) {
        const matches = synonyms.some(s => scholarshipLevels.some((sl: string) => sl.includes(s)));
        if (matches) {
          score += 20;
          reasons.push(`Matches your desired degree level (${profile.desiredDegree || profile.educationLevel})`);
        }
        break;
      }
    }
  }

  // Field of study match (15 points max)
  if (profile.fieldOfStudy) {
    const studentField = normalizeField(profile.fieldOfStudy);
    const scholarshipFields = [
      ...(scholarship.fields || []).map((f: { field?: { name?: string } }) => f.field?.name || "").map(normalizeField),
      ...(scholarship.fieldLabels || []).map(normalizeField),
    ].filter(Boolean);
    
    const fieldMatch = scholarshipFields.some((sf: string) => 
      sf.includes(studentField) || studentField.includes(sf)
    );
    
    if (fieldMatch) {
      score += 15;
      reasons.push(`Matches your field of study: ${profile.fieldOfStudy}`);
    }
  }

  // GPA match (10 points max)
  if (profile.gpa && scholarship.minGpa) {
    if (profile.gpa >= scholarship.minGpa) {
      score += 10;
      reasons.push(`Your GPA (${profile.gpa}) meets the minimum requirement (${scholarship.minGpa})`);
    }
  } else if (profile.gpa && !scholarship.minGpa) {
    score += 5;
    reasons.push("No minimum GPA specified");
  }

  // Language requirements (5 points max)
  if ((profile.ielts || profile.toefl) && (scholarship.ieltsReq || scholarship.toeflReq)) {
    let langMatch = false;
    if (profile.ielts && scholarship.ieltsReq && profile.ielts >= scholarship.ieltsReq) {
      langMatch = true;
    }
    if (profile.toefl && scholarship.toeflReq && profile.toefl >= scholarship.toeflReq) {
      langMatch = true;
    }
    if (langMatch) {
      score += 5;
      reasons.push("You meet the language requirements");
    }
  }

  // Funding preference (10 points max)
  if (profile.fundingLevel === "fully-funded" && scholarship.isFullyFunded) {
    score += 10;
    reasons.push("Fully funded opportunity matching your preference");
  } else if (profile.fundingLevel === "partial" && !scholarship.isFullyFunded) {
    score += 5;
    reasons.push("Partially funded opportunity");
  }

  // Deadline urgency (bonus points)
  if (scholarship.deadline) {
    const daysUntilDeadline = Math.ceil(
      (new Date(scholarship.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDeadline > 0 && daysUntilDeadline <= 30) {
      score += 5;
      reasons.push(`Deadline approaching (${daysUntilDeadline} days)`);
    }
  }

  return { score: Math.min(score, 100), reasons };
}

export async function findMatches(profile: MatchProfile): Promise<MatchResult[]> {
  const where: Record<string, unknown> = {
    publishStatus: "PUBLISHED",
    deletedAt: null,
  };

  if (profile.citizenship) {
    where.eligibleCountries = { hasSome: [profile.citizenship] };
  }

  if (profile.needFullFunding) {
    where.isFullyFunded = true;
  }

  if (profile.field) {
    where.fields = { some: { field: { name: { contains: profile.field, mode: "insensitive" } } } };
  }

  if (profile.degreeLevel) {
    where.degreeLevels = { has: profile.degreeLevel };
  }

  if (profile.targetCountries && profile.targetCountries.length > 0) {
    where.OR = profile.targetCountries.map((c) => ({
      country: { name: { equals: c, mode: "insensitive" } },
    }));
  }

  const scholarships = await prisma.scholarship.findMany({
    where,
    include: {
      country: { select: { name: true, code: true } },
      university: { select: { name: true } },
      fields: { include: { field: { select: { name: true } } } },
    },
    take: 100,
  });

  const closingSoonDays = await getSettingNumber("scholarships.closingSoonDays", 14);
  const now = new Date();

  const results: MatchResult[] = scholarships
    .map((scholarship) => {
      const studentProfile: StudentProfile = {
        id: "temp",
        country: profile.targetCountries?.[0],
        citizenship: profile.citizenship,
        educationLevel: profile.degreeLevel,
        desiredDegree: profile.degreeLevel,
        fieldOfStudy: profile.field,
        gpa: profile.gpa,
        targetCountries: profile.targetCountries,
        fundingLevel: profile.needFullFunding ? "fully-funded" : undefined,
      };

      const { score, reasons } = calculateMatchScore(studentProfile, scholarship);
      const deadlineStatus = evaluateDeadlineSync({
        deadline: scholarship.deadline,
        openingDate: scholarship.openingDate,
        override: scholarship.deadlineStatusOverride,
        closingSoonDays,
        now,
      });

      return {
        scholarshipId: scholarship.id,
        scholarshipTitle: scholarship.title,
        universityName: scholarship.university?.name ?? scholarship.universityNameLegacy,
        countryName: scholarship.country?.name ?? scholarship.countryNameLegacy,
        fundingType: scholarship.fundingType,
        isFullyFunded: scholarship.isFullyFunded,
        deadline: scholarship.deadline,
        matchScore: score,
        matchReasons: reasons,
      };
    })
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 50);

  return results;
}

export async function saveMatch(
  userId: string,
  scholarshipId: string,
  matchScore: number,
  matchReasons: string[]
) {
  return prisma.scholarshipMatch.upsert({
    where: {
      userId_scholarshipId: { userId, scholarshipId },
    },
    create: {
      userId,
      scholarshipId,
      matchScore,
      matchReasons,
      status: "SUGGESTED",
    },
    update: {
      matchScore,
      matchReasons,
      updatedAt: new Date(),
    },
  });
}

export async function getUserMatches(userId: string, status?: string) {
  return prisma.scholarshipMatch.findMany({
    where: {
      userId,
      ...(status ? { status: status as any } : {}),
    },
    include: {
      scholarship: {
        include: {
          country: { select: { name: true, code: true } },
          university: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { matchScore: "desc" },
  });
}

export async function updateMatchStatus(
  userId: string,
  scholarshipId: string,
  status: string,
  notes?: string
) {
  return prisma.scholarshipMatch.update({
    where: { userId_scholarshipId: { userId, scholarshipId } },
    data: {
      status: status as any,
      userNotes: notes,
      ...(status === "APPLIED" ? { appliedAt: new Date() } : {}),
      ...(status === "AWARDED" || status === "REJECTED" ? { reviewedAt: new Date() } : {}),
    },
  });
}