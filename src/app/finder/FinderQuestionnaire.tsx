"use client";

import React, { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, RotateCcw, Search, ShieldCheck, X } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { runEligibilityMatch } from "@/app/actions/public-actions";
import type { PublicCountryOption, PublicField, PublicScholarship } from "@/lib/data/public";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";

interface MatchResultItem {
  scholarship: PublicScholarship;
  score: number;
  reasons: string[];
  missing?: string[];
  warnings?: string[];
}

interface FormData {
  citizenship: string;
  field: string;
  degreeLevel: string;
  targetCountries: string[];
  gpa: string;
  languageScore: string;
  needFullFunding: boolean;
  startYear: string;
  experience: string;
  priority: string;
}

/**
 * The ten-step questionnaire. Options arrive as props from the server page, and
 * the match itself is scored by a server action, so the browser never reads the
 * public API.
 */
export function FinderQuestionnaire({
  countries,
  fields
}: {
  countries: PublicCountryOption[];
  fields: PublicField[];
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResultItem[] | null>(null);
  const [destinationQuery, setDestinationQuery] = useState("");

  // Form State across 10 steps
  const [formData, setFormData] = useState<FormData>({
    citizenship: "", // No default: the visitor picks from the published list.
    field: "Computer Science",
    degreeLevel: "Master's",
    targetCountries: ["de", "us", "gb"],
    gpa: "3.7",
    languageScore: "IELTS 7.0+",
    needFullFunding: true,
    startYear: "2027",
    experience: "1-2 Years Professional Experience",
    priority: "Full Tuition + Living Expenses",
  });

  // Keyed generic so each field keeps its own value type instead of collapsing to any.
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Destinations are searchable by name, capital, or ISO code, and selected
  // entries are pinned to the top so they never scroll out of reach.
  const destinationMatches = useMemo(() => {
    const term = destinationQuery.trim().toLowerCase();
    const selected = countries.filter((c) => formData.targetCountries.includes(c.id));
    const rest = countries.filter((c) => !formData.targetCountries.includes(c.id));
    if (!term) return [...selected, ...rest];
    const matches = rest.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.capital ?? "").toLowerCase().includes(term) ||
        c.code.toLowerCase() === term
    );
    return [...selected, ...matches];
  }, [countries, destinationQuery, formData.targetCountries]);

  const handleNext = () => {
    if (step < 10) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const gpaNum = parseFloat(formData.gpa) || 3.5;
      const matched = await runEligibilityMatch({
        citizenship: formData.citizenship,
        field: formData.field,
        degreeLevel: formData.degreeLevel,
        targetCountries: formData.targetCountries,
        gpa: gpaNum,
        needFullFunding: formData.needFullFunding,
      });
      setResults(matched);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setDestinationQuery("");
    setStep(1);
  };

  return (
    <div className="bg-gray-50/50 min-h-screen py-12">
      <Container size="md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 mb-3">
            <span>Eligibility &amp; Scholarship Matcher</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-950 sm:text-4xl">
            Scholarship Finder
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-lg mx-auto">
            Answer 10 brief questions to receive calculated matches with clear explanations of your eligibility.
          </p>
        </div>

        {/* Results View */}
        {results !== null ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-emerald-950">
                    We Found {results.length} Potential Scholarship Matches!
                  </h2>
                  <p className="text-xs text-emerald-800 mt-1">
                    Ranked by alignment with your degree, field, target countries, and funding preferences.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Start Over
                </button>
              </div>

              {/* Disclaimer */}
              <div className="mt-4 rounded-xl bg-white/80 p-3 text-xs text-gray-600 border border-emerald-100 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Important Notice:</strong> Matches are algorithmic recommendations based on your inputs and do not guarantee formal admission or funding. Always verify official requirements directly with the provider.
                </span>
              </div>

              {/* The questionnaire asks for citizenship, but the listings store
                  nationality rules as prose ("Chevening-eligible countries"),
                  so scoring them would be guesswork. Say so rather than imply
                  the answer changed the ranking. */}
              <div className="mt-3 rounded-xl bg-white/80 p-3 text-xs text-gray-600 border border-emerald-100 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Not scored:</strong> Your citizenship is not part of this ranking. Scholarship
                  eligibility by nationality is published in prose by each provider, so check your
                  eligibility on the official source before applying.
                </span>
              </div>
            </div>

            {/* Match Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {results.map((res) => (
                <ScholarshipCard
                  key={res.scholarship.id}
                  scholarship={res.scholarship}
                  matchScore={res.score}
                  matchReasons={res.reasons}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Questionnaire Wizard Container */
          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                <span>Step {step} of 10</span>
                <span>{step * 10}% Completed</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-300 rounded-full"
                  style={{ width: `${step * 10}%` }}
                />
              </div>
            </div>

            {/* STEP CONTENT */}
            <div className="min-h-[280px]">
              {/* Step 1: Citizenship */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">1. Where are you from? (Country of Citizenship)</h3>
                  <p className="text-xs text-gray-500">Many international scholarships have specific bilateral or regional quotas.</p>
                  <label htmlFor="finder-citizenship" className="sr-only">
                    Country of citizenship
                  </label>
                  <select
                    id="finder-citizenship"
                    value={formData.citizenship}
                    onChange={(e) => updateField("citizenship", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Select your country</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="other">Other Developing Nation / Global</option>
                  </select>
                </div>
              )}

              {/* Step 2: Field */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">2. What do you want to study? (Field of Study)</h3>
                  <p className="text-xs text-gray-500">Select your intended major or research discipline.</p>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {fields.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => updateField("field", f.name)}
                        className={`rounded-xl border p-3 text-left text-xs font-semibold transition-colors ${formData.field === f.name
                            ? "border-primary-600 bg-primary-50 text-primary-900"
                            : "border-gray-200 hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Degree */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">3. What degree level are you applying for?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: "Undergraduate", label: "Undergraduate / Bachelor's" },
                      { id: "Master's", label: "Master's / Postgraduate" },
                      { id: "PhD", label: "PhD / Doctoral Degree" },
                      { id: "Postdoctoral", label: "Postdoctoral / Fellowship" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => updateField("degreeLevel", d.id)}
                        className={`rounded-xl border p-4 text-left font-semibold text-sm transition-colors ${formData.degreeLevel === d.id
                            ? "border-primary-600 bg-primary-50 text-primary-900"
                            : "border-gray-200 hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Destination countries */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">4. Where would you like to study?</h3>
                  <p className="text-xs text-gray-500">
                    Search or scroll through all {countries.length} destinations, then select one or
                    more. Your choices are used to rank matches.
                  </p>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <label htmlFor="destination-search" className="sr-only">
                      Search destinations by country or capital
                    </label>
                    <input
                      id="destination-search"
                      type="search"
                      value={destinationQuery}
                      onChange={(e) => setDestinationQuery(e.target.value)}
                      placeholder="Search destinations (e.g. Canada, Tokyo, Nairobi)..."
                      className="min-h-[44px] w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>

                  {formData.targetCountries.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-500">
                        {formData.targetCountries.length} selected:
                      </span>
                      {formData.targetCountries.map((id) => {
                        const c = countries.find((x) => x.id === id);
                        if (!c) return null;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() =>
                              updateField(
                                "targetCountries",
                                formData.targetCountries.filter((x) => x !== id)
                              )
                            }
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 py-1 pl-1.5 pr-2 text-xs font-semibold text-primary-800"
                          >
                            <CountryFlag code={c.code} name={c.name} size="sm" />
                            {c.name}
                            <X className="h-3.5 w-3.5" />
                            <span className="sr-only">Remove {c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {destinationMatches.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-500">
                      No destinations match &ldquo;{destinationQuery}&rdquo;.
                    </p>
                  ) : (
                    <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                      {destinationMatches.map((c) => {
                        const selected = formData.targetCountries.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              if (selected) {
                                updateField(
                                  "targetCountries",
                                  formData.targetCountries.filter((id) => id !== c.id)
                                );
                              } else {
                                updateField("targetCountries", [...formData.targetCountries, c.id]);
                              }
                            }}
                            aria-pressed={selected}
                            className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-semibold transition-colors ${selected
                                ? "border-primary-600 bg-primary-50 text-primary-900"
                                : "border-gray-200 hover:bg-gray-50 text-gray-700"
                              }`}
                          >
                            <CountryFlag code={c.code} name={c.name} size="sm" />
                            <span className="min-w-0">
                              <span className="block truncate">{c.name}</span>
                              {c.capital && (
                                <span className="block truncate text-[10px] font-normal text-gray-500">
                                  {c.capital}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Academic Performance (GPA) */}
              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">5. What is your academic performance (GPA)?</h3>
                  <p className="text-xs text-gray-500">Approximate equivalent on a 4.0 scale.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { val: "3.8", label: "3.8 - 4.0 (Top 5% / First Class Honours)" },
                      { val: "3.5", label: "3.5 - 3.79 (High Distinction)" },
                      { val: "3.0", label: "3.0 - 3.49 (Good Academic Standing)" },
                      { val: "2.5", label: "Below 3.0" },
                    ].map((g) => (
                      <button
                        key={g.val}
                        type="button"
                        onClick={() => updateField("gpa", g.val)}
                        className={`rounded-xl border p-4 text-left font-semibold text-sm transition-colors ${formData.gpa === g.val
                            ? "border-primary-600 bg-primary-50 text-primary-900"
                            : "border-gray-200 hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 6: Language Score */}
              {step === 6 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">6. What is your English / Language proficiency?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { val: "IELTS 7.5+", label: "IELTS 7.5+ / TOEFL 105+ (Fluent)" },
                      { val: "IELTS 6.5 - 7.0", label: "IELTS 6.5 - 7.0 / TOEFL 90-100 (Competent)" },
                      { val: "IELTS 6.0", label: "IELTS 6.0 / TOEFL 80 (Moderate)" },
                      { val: "No Test Yet", label: "Haven't taken a test yet / Require waiver" },
                    ].map((l) => (
                      <button
                        key={l.val}
                        type="button"
                        onClick={() => updateField("languageScore", l.val)}
                        className={`rounded-xl border p-4 text-left font-semibold text-sm transition-colors ${formData.languageScore === l.val
                            ? "border-primary-600 bg-primary-50 text-primary-900"
                            : "border-gray-200 hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 7: Funding Need */}
              {step === 7 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">7. Do you require full funding?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateField("needFullFunding", true)}
                      className={`rounded-xl border p-4 text-left font-semibold text-sm transition-colors ${formData.needFullFunding === true
                          ? "border-primary-600 bg-primary-50 text-primary-900"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                      Yes, I require 100% full funding (Tuition + Living Stipend)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("needFullFunding", false)}
                      className={`rounded-xl border p-4 text-left font-semibold text-sm transition-colors ${formData.needFullFunding === false
                          ? "border-primary-600 bg-primary-50 text-primary-900"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                      Partial funding or tuition waiver is sufficient
                    </button>
                  </div>
                </div>
              )}

              {/* Step 8: Start Date */}
              {step === 8 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">8. When do you plan to start studying?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {["Fall 2027", "Spring 2027", "2028 or Later"].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => updateField("startYear", yr)}
                        className={`rounded-xl border p-4 text-left font-semibold text-sm transition-colors ${formData.startYear === yr
                            ? "border-primary-600 bg-primary-50 text-primary-900"
                            : "border-gray-200 hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 9: Work / Research Exp */}
              {step === 9 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">9. Do you have relevant work or research experience?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "2+ Years Professional Work Experience",
                      "Academic Research & Publications",
                      "Community Leadership & Volunteering",
                      "Fresh Graduate / No Prior Experience",
                    ].map((exp) => (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => updateField("experience", exp)}
                        className={`rounded-xl border p-4 text-left font-semibold text-sm transition-colors ${formData.experience === exp
                            ? "border-primary-600 bg-primary-50 text-primary-900"
                            : "border-gray-200 hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 10: Priority */}
              {step === 10 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">10. What is most important to you?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Maximum Financial Support",
                      "University Prestige & Global Ranking",
                      "Post-Study Work Permit & Visa Ease",
                      "Low Application / Admission Barriers",
                    ].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateField("priority", p)}
                        className={`rounded-xl border p-4 text-left font-semibold text-sm transition-colors ${formData.priority === p
                            ? "border-primary-600 bg-primary-50 text-primary-900"
                            : "border-gray-200 hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
              <button
                type="button"
                disabled={step === 1}
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
              >
                {loading ? (
                  <span>Analyzing Eligibility...</span>
                ) : step === 10 ? (
                  <span>Generate Matches</span>
                ) : (
                  <>
                    <span>Next Step</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
