"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BarChart2, Target, Brain, Award, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useStore } from "@/lib/store/useStore";
import type { PublicScholarship } from "@/lib/data/public";
import { runEligibilityMatch } from "@/app/actions/public-actions";

interface MatchBreakdown {
  category: string;
  score: number;
  maxScore: number;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface MatchResult {
  scholarshipId: string;
  scholarshipTitle: string;
  totalScore: number;
  breakdown: MatchBreakdown[];
  reasons: string[];
}

const MATCH_CATEGORIES: Omit<MatchBreakdown, "score">[] = [
  {
    category: "Country Match",
    maxScore: 30,
    description: "Target countries & citizenship alignment",
    icon: <Target className="h-4 w-4" />,
    color: "text-primary-700",
    bgColor: "bg-primary-100",
  },
  {
    category: "Eligibility",
    maxScore: 20,
    description: "Nationality eligibility for this scholarship",
    icon: <Award className="h-4 w-4" />,
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
  },
  {
    category: "Degree Level",
    maxScore: 20,
    description: "Your degree level matches requirements",
    icon: <Brain className="h-4 w-4" />,
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
  },
  {
    category: "Field of Study",
    maxScore: 15,
    description: "Your field matches scholarship disciplines",
    icon: <Target className="h-4 w-4" />,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  {
    category: "Academic & Language",
    maxScore: 15,
    description: "GPA and language requirements",
    icon: <BarChart2 className="h-4 w-4" />,
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  {
    category: "Funding Preference",
    maxScore: 10,
    description: "Full funding vs partial funding match",
    icon: <Award className="h-4 w-4" />,
    color: "text-teal-700",
    bgColor: "bg-teal-100",
  },
];

function calculateMatchBreakdown(
  profile: {
    citizenship?: string | null;
    degreeLevel?: string | null;
    field?: string | null;
    targetCountries?: string[];
    gpa?: number | null;
    needFullFunding?: boolean;
  },
  scholarship: PublicScholarship
): MatchResult {
  const breakdown: MatchBreakdown[] = [];
  const reasons: string[] = [];
  let totalScore = 0;

  // 1. Country Match (30 pts)
  let countryScore = 0;
  if (profile.targetCountries && profile.targetCountries.length > 0) {
    const scholarshipCountry = (scholarship.countryCode || "").toLowerCase();
    if (profile.targetCountries.map(c => c.toLowerCase()).includes(scholarshipCountry)) {
      countryScore = 30;
      reasons.push(`Matches your target country: ${scholarship.countryName}`);
    }
  } else if (profile.citizenship) {
    const scholarshipCountry = (scholarship.countryCode || "").toLowerCase();
    const citizenCountry = profile.citizenship.toLowerCase();
    if (citizenCountry === scholarshipCountry) {
      countryScore = 20;
      reasons.push(`Available in your country of citizenship`);
    }
  }
  breakdown.push({
    ...MATCH_CATEGORIES[0],
    score: countryScore,
  });
  totalScore += countryScore;

  // 2. Eligibility (20 pts)
  let eligibilityScore = 0;
  const eligibleCountries = scholarship.eligibleCountries || [];
  const isOpenToAll = eligibleCountries.some((c: string) =>
    c.toLowerCase().includes("all") || c.toLowerCase().includes("international")
  );
  if (isOpenToAll) {
    eligibilityScore = 15;
    reasons.push("Open to all nationalities");
  } else if (profile.citizenship) {
    const citizenLower = profile.citizenship.toLowerCase();
    const isEligible = eligibleCountries.some((c: string) =>
      c.toLowerCase().includes(citizenLower) || citizenLower.includes(c.toLowerCase())
    );
    if (isEligible) {
      eligibilityScore = 20;
      reasons.push(`Your nationality (${profile.citizenship}) is eligible`);
    }
  }
  breakdown.push({
    ...MATCH_CATEGORIES[1],
    score: eligibilityScore,
  });
  totalScore += eligibilityScore;

  // 3. Degree Level (20 pts)
  let degreeScore = 0;
  if (profile.degreeLevel) {
    const studentLevel = profile.degreeLevel.toLowerCase();
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
          degreeScore = 20;
          reasons.push(`Matches your desired degree level (${profile.degreeLevel})`);
        }
        break;
      }
    }
  }
  breakdown.push({
    ...MATCH_CATEGORIES[2],
    score: degreeScore,
  });
  totalScore += degreeScore;

  // 4. Field of Study (15 pts)
  let fieldScore = 0;
  if (profile.field) {
    const studentField = profile.field.toLowerCase().trim();
    const scholarshipFields = [
      ...(scholarship.fields || []).map((f: string) => f.toLowerCase()),
    ].filter(Boolean);

    const fieldMatch = scholarshipFields.some((sf: string) =>
      sf.includes(studentField) || studentField.includes(sf)
    );

    if (fieldMatch) {
      fieldScore = 15;
      reasons.push(`Matches your field of study: ${profile.field}`);
    }
  }
  breakdown.push({
    ...MATCH_CATEGORIES[3],
    score: fieldScore,
  });
  totalScore += fieldScore;

  // 5. Academic & Language (15 pts)
  let academicScore = 0;
  if (profile.gpa && scholarship.minGpa) {
    if (profile.gpa >= scholarship.minGpa) {
      academicScore += 10;
      reasons.push(`Your GPA (${profile.gpa}) meets the minimum (${scholarship.minGpa})`);
    }
  } else if (profile.gpa && !scholarship.minGpa) {
    academicScore += 5;
    reasons.push("No minimum GPA specified");
  }
  breakdown.push({
    ...MATCH_CATEGORIES[4],
    score: academicScore,
  });
  totalScore += academicScore;

  // 6. Funding Preference (10 pts)
  let fundingScore = 0;
  if (profile.needFullFunding && scholarship.isFullyFunded) {
    fundingScore = 10;
    reasons.push("Fully funded opportunity matching your preference");
  } else if (!profile.needFullFunding && !scholarship.isFullyFunded) {
    fundingScore = 5;
    reasons.push("Partially funded opportunity");
  }
  breakdown.push({
    ...MATCH_CATEGORIES[5],
    score: fundingScore,
  });
  totalScore += fundingScore;

  // Cap at 100
  totalScore = Math.min(totalScore, 100);

  return {
    scholarshipId: scholarship.id,
    scholarshipTitle: scholarship.title,
    totalScore,
    breakdown,
    reasons,
  };
}

interface MatchVisualizationProps {
  scholarships: PublicScholarship[];
  userProfile?: {
    citizenship?: string | null;
    degreeLevel?: string | null;
    field?: string | null;
    targetCountries?: string[];
    gpa?: number | null;
    needFullFunding?: boolean;
  };
  maxItems?: number;
}

export function MatchVisualization({
  scholarships,
  userProfile,
  maxItems = 5,
}: MatchVisualizationProps) {
  const { user } = useStore();
  const [serverMatches, setServerMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Use user from store if no profile passed
  const profile = useMemo(() => userProfile || {
    citizenship: user?.citizenship ?? null,
    degreeLevel: user?.degreeLevel ?? null,
    field: user?.field ?? null,
    targetCountries: user?.targetCountries ?? [],
    gpa: user?.gpa ?? null,
    needFullFunding: user?.needFullFunding ?? false,
  }, [userProfile, user]);

  // Calculate client-side matches
  const clientMatches = useMemo(() => {
    return scholarships
      .map(s => calculateMatchBreakdown(profile, s))
      .filter(m => m.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, maxItems);
  }, [scholarships, profile, maxItems]);

  // Fetch server-side matches if profile has enough data
  useEffect(() => {
    let mounted = true;
    
    if (
      profile.citizenship &&
      profile.field &&
      profile.degreeLevel &&
      !serverMatches.length
    ) {
      // Use a promise to defer setLoading to avoid synchronous setState in effect
      Promise.resolve().then(() => {
        if (!mounted) return;
        setLoading(true);
      });
      
      runEligibilityMatch({
        citizenship: profile.citizenship,
        field: profile.field,
        degreeLevel: profile.degreeLevel,
        targetCountries: profile.targetCountries || [],
        gpa: profile.gpa || 3.5,
        needFullFunding: profile.needFullFunding || false,
      })
        .then(results => {
          if (!mounted) return;
          const mapped: MatchResult[] = results.map(r => ({
            scholarshipId: r.scholarship.id,
            scholarshipTitle: r.scholarship.title,
            totalScore: r.score,
            breakdown: [],
            reasons: r.reasons,
          }));
          setServerMatches(mapped);
        })
        .catch(() => {
          if (!mounted) return;
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }
    
    return () => {
      mounted = false;
    };
  }, [profile.citizenship, profile.field, profile.degreeLevel, profile.gpa, profile.needFullFunding, profile.targetCountries, serverMatches.length]);

  // Use server matches if available, otherwise client matches
  const matches = serverMatches.length > 0 ? serverMatches : clientMatches;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-100";
    if (score >= 60) return "text-primary-600 bg-primary-100";
    if (score >= 40) return "text-amber-600 bg-amber-100";
    return "text-secondary-600 bg-secondary-100";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Moderate Match";
    return "Low Match";
  };

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-secondary-300 bg-white p-8 text-center">
        <Brain className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-secondary-900">No Matches Found</h3>
        <p className="mt-2 text-sm text-secondary-600 max-w-md mx-auto">
          Complete your profile in Settings to see personalized scholarship matches with detailed scoring.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-100 text-primary-700">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-secondary-900">Your Scholarship Matches</h3>
            <p className="text-xs text-secondary-500">
              Ranked by compatibility with your profile
            </p>
          </div>
        </div>
        {serverMatches.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
            <TrendingUp className="h-3 w-3" />
            Powered by Eligibility Engine
          </span>
        )}
      </div>

      {/* Match Cards */}
      <div className="space-y-4">
        {matches.map((match, index) => {
          const isExpanded = expanded === match.scholarshipId;

          return (
            <div
              key={match.scholarshipId}
              className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-xs transition-all hover:shadow-sm"
            >
              {/* Main Row */}
              <button
                onClick={() => setExpanded(isExpanded ? null : match.scholarshipId)}
                className="w-full flex items-center gap-4"
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  <span className="text-sm font-bold text-secondary-500">#{index + 1}</span>
                </div>

                {/* Scholarship Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-secondary-900 truncate">
                    {match.scholarshipTitle}
                  </p>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    {match.reasons.slice(0, 2).join(" • ") || "Profile-based compatibility"}
                  </p>
                </div>

                {/* Score Badge */}
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold text-sm ${getScoreColor(match.totalScore)}`}
                  >
                    <span className="text-lg">{match.totalScore}%</span>
                  </div>
                  <span className="text-xs text-secondary-500">{getScoreLabel(match.totalScore)}</span>
                </div>

                {/* Expand Icon */}
                <div className="flex-shrink-0 text-secondary-400">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </button>

              {/* Expanded Breakdown */}
              {isExpanded && match.breakdown.length > 0 && (
                <div className="mt-4 pt-4 border-t border-secondary-100 animate-slide-down">
                  <h4 className="text-xs font-semibold text-secondary-700 uppercase tracking-wider mb-3">
                    Match Score Breakdown
                  </h4>
                  <div className="space-y-3">
                    {match.breakdown.map((item) => (
                      <div key={item.category}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center rounded-lg p-1 ${item.bgColor} ${item.color}`}>
                              {item.icon}
                            </span>
                            <span className="text-sm font-medium text-secondary-900">{item.category}</span>
                          </div>
                          <span className={`text-sm font-bold ${item.score >= item.maxScore * 0.7 ? "text-emerald-600" : item.score > 0 ? "text-primary-600" : "text-secondary-400"}`}>
                            {item.score}/{item.maxScore}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.score >= item.maxScore * 0.7 ? "bg-emerald-500" :
                              item.score > 0 ? "bg-primary-500" : "bg-secondary-300"
                            }`}
                            style={{ width: `${Math.max((item.score / item.maxScore) * 100, item.score > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-secondary-500 ml-10">{item.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* All Reasons */}
                  {match.reasons.length > 0 && (
                    <div className="mt-4 p-3 rounded-xl bg-secondary-50 border border-secondary-100">
                      <h5 className="text-xs font-semibold text-secondary-700 uppercase tracking-wider mb-2">
                        Why This Matches
                      </h5>
                      <ul className="space-y-1">
                        {match.reasons.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-secondary-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" />
          <span className="ml-3 text-sm text-secondary-600">Analyzing your profile...</span>
        </div>
      )}
    </div>
  );
}

// Export for use in other components
export { calculateMatchBreakdown, type MatchBreakdown, type MatchResult };