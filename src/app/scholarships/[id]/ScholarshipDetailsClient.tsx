"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Bookmark, Layers, MapPin, GraduationCap, DollarSign, ShieldCheck, CheckCircle2, FileText, Clock, Send, Building, Check, X } from "lucide-react";
import { Container } from "@/components/layout/Layout";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { fetchPublicScholarship } from "@/app/actions/public-actions";
import type { PublicScholarship } from "@/lib/data/public";
import { useStore } from "@/lib/store/useStore";
import { formatDate, formatDateLong, getVerificationBadge } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ScholarshipDetailsClient({
  initialScholarship,
}: {
  initialScholarship?: PublicScholarship;
}) {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // The server already resolved this record and passed it in, so there is no
  // loading state and no second round trip on a normal page view.
  const [scholarship, setScholarship] = useState<PublicScholarship | null>(
    initialScholarship ?? null
  );
  const { isSaved, toggleSaveScholarship, compareIds, toggleCompare, trackApplication } = useStore();

  // Which id we have already settled on, so "loading" can be derived rather than
  // tracked in state. The server normally supplies the record; this only matters
  // for a client-side navigation to another id.
  const [settledId, setSettledId] = useState<string | null>(null);

  // Re-resolve only if the client ever navigates between records without the
  // server re-rendering (for example after a client-side push). This goes
  // through a server action, not the public JSON route.
  useEffect(() => {
    if (initialScholarship) return;
    if (!id) return;
    let cancelled = false;
    fetchPublicScholarship(id)
      .then((data) => {
        if (!cancelled) setScholarship(data);
      })
      .catch(() => {
        if (!cancelled) setScholarship(null);
      })
      .finally(() => {
        if (!cancelled) setSettledId(id);
      });
    return () => {
      cancelled = true;
    };
  }, [id, initialScholarship]);

  const loading = !initialScholarship && Boolean(id) && settledId !== id;

  if (loading) {
    return (
      <Container className="py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Loading scholarship details...</p>
      </Container>
    );
  }

  if (!scholarship) {
    return (
      <Container className="py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900">Scholarship Not Found</h2>
        <p className="mt-2 text-sm text-gray-500">The scholarship you are looking for does not exist or has been removed.</p>
        <Link
          href="/scholarships"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all scholarships
        </Link>
      </Container>
    );
  }

  // Country, provider and university travel with the record, so no client-side
  // lookup table is needed. A stipend only counts when one is actually recorded.
  const hasStipend = (scholarship.livingStipend ?? 0) > 0;
  // Prefer the dedicated application URL, fall back to the official page.
  const applyUrl = scholarship.applicationUrl || scholarship.officialUrl || null;

  const saved = isSaved(scholarship.id);
  const isCompared = compareIds.includes(scholarship.id);
  const verification = getVerificationBadge(scholarship.verificationStatus);

  const handleSave = () => {
    toggleSaveScholarship(scholarship.id);
    toast.success(saved ? "Removed from saved" : "Saved to your list");
  };

  const handleCompare = () => {
    if (!isCompared && compareIds.length >= 4) {
      toast.error("You can compare up to 4 scholarships at once");
      return;
    }
    toggleCompare(scholarship.id);
    toast.success(isCompared ? "Removed from compare" : "Added to comparison");
  };

  const handleTrack = () => {
    trackApplication(scholarship);
    toast.success("Added to your Application Tracker!");
    router.push("/tracker");
  };

  return (
    <div className="bg-gray-50/50 min-h-screen py-8">
      <Container>
        {/* Back Link */}
        <Link
          href="/scholarships"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Search Results
        </Link>

        {/* 1. TOP HERO CARD */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                {scholarship.fundingType.replace("-", " ")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                <span>{verification.icon}</span>
                <span>{verification.label} ({formatDate(scholarship.lastVerifiedAt)})</span>
              </span>
              <span className="inline-flex items-center rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                Status: {scholarship.status}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  saved
                    ? "border-primary-200 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-primary-600" : ""}`} />
                {saved ? "Saved" : "Save"}
              </button>

              <button
                onClick={handleCompare}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isCompared
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                {isCompared ? "In Compare" : "Compare"}
              </button>

              <button
                onClick={handleTrack}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-black"
              >
                + Track
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-950 tracking-tight leading-tight">
            {scholarship.title}
          </h1>

          {/* Sub-header info */}
          <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-gray-600">
            {scholarship.providerName && (
              <div className="flex items-center gap-1.5">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="font-semibold text-gray-900">{scholarship.providerName}</span>
              </div>
            )}
            {scholarship.universityName && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                <span>{scholarship.universityName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gray-400" />
              <CountryFlag
                code={scholarship.countryCode}
                name={scholarship.countryName ?? undefined}
                size="xs"
              />
              <span>{scholarship.countryName || "Global"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-gray-900">Deadline: {formatDateLong(scholarship.deadline)}</span>
            </div>
          </div>

          {/* Primary Apply CTA Banner */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 p-5 text-white">
            <div>
              <p className="font-bold text-base">Ready to submit your application?</p>
              <p className="text-xs text-primary-100 mt-0.5">
                Always submit directly through the official provider portal. Global Scholarship Hub charges no fees.
              </p>
            </div>
            {/* Only offer an apply link when an official URL was actually
                recorded, so we never render a button that goes nowhere. */}
            {applyUrl ? (
              <a
                href={applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-md transition-transform hover:-translate-y-0.5 hover:bg-gray-100 shrink-0"
              >
                <span>Apply on Official Website</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <span className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-6 py-3 text-sm font-semibold text-gray-500 sm:cursor-not-allowed">
                Application link not yet verified
              </span>
            )}
          </div>
        </div>

        {/* 2. MAIN CONTENT GRID */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Detailed Sections */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-600" />
                Scholarship Overview
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {scholarship.description}
              </p>
            </div>

            {/* Financial Coverage Breakdown */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Financial Coverage & Benefits
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${scholarship.tuitionCoverage ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                    {scholarship.tuitionCoverage ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Tuition Fees</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {scholarship.tuitionCoverage ? "100% Tuition covered" : "Partial or not included"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${hasStipend ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                    {hasStipend ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Living Stipend</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {hasStipend
                        ? `${scholarship.currency || '$'}${(scholarship.livingStipend ?? 0).toLocaleString()} / month allowance`
                        : "Self-funded"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${scholarship.accommodationCoverage ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                    {scholarship.accommodationCoverage ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Accommodation</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {scholarship.accommodationCoverage ? "University housing provided" : "Covered via living stipend"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${scholarship.travelAllowance ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                    {scholarship.travelAllowance ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Airfare & Travel</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {scholarship.travelAllowance ? "Return economy flights included" : "Not covered"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${scholarship.healthInsurance ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                    {scholarship.healthInsurance ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Health Insurance</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {scholarship.healthInsurance ? "Comprehensive health cover included" : "Student responsibility"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${scholarship.visaSupport ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                    {scholarship.visaSupport ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Visa Support & Fees</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {scholarship.visaSupport ? "Visa sponsorship & fees reimbursed" : "Assistance letter provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Eligibility & Requirements */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary-600" />
                Eligibility Criteria
              </h2>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="border-b border-gray-100 pb-3">
                  <span className="font-semibold text-gray-900 block text-xs uppercase tracking-wider text-gray-500 mb-1">
                    Eligible Nationalities
                  </span>
                  <p>{scholarship.eligibleCountries.join(", ")}</p>
                </div>

                <div className="border-b border-gray-100 pb-3">
                  <span className="font-semibold text-gray-900 block text-xs uppercase tracking-wider text-gray-500 mb-1">
                    Eligible Degree Levels
                  </span>
                  <p>{scholarship.degreeLevels.join(", ")}</p>
                </div>

                <div className="border-b border-gray-100 pb-3">
                  <span className="font-semibold text-gray-900 block text-xs uppercase tracking-wider text-gray-500 mb-1">
                    Eligible Fields of Study
                  </span>
                  <p>{scholarship.fields.join(", ")}</p>
                </div>

                {scholarship.minGpa && (
                  <div className="border-b border-gray-100 pb-3">
                    <span className="font-semibold text-gray-900 block text-xs uppercase tracking-wider text-gray-500 mb-1">
                      Academic Requirements / GPA
                    </span>
                    <p>Minimum GPA of {scholarship.minGpa} / 4.0 or equivalent academic distinction.</p>
                  </div>
                )}

                <div>
                  <span className="font-semibold text-gray-900 block text-xs uppercase tracking-wider text-gray-500 mb-1">
                    Language Proficiency Requirements
                  </span>
                  <ul className="list-disc pl-5 space-y-1">
                    {scholarship.languageReqs.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Application Process (Numbered Steps) */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-600" />
                Step-by-Step Application Process
              </h2>
              <ol className="space-y-4 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-xs text-primary-700">1</span>
                  <div>
                    <span className="font-bold text-gray-900">Verify Eligibility:</span> Check that your country of origin, degree level, and academic records satisfy the criteria.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-xs text-primary-700">2</span>
                  <div>
                    <span className="font-bold text-gray-900">Prepare Required Documents:</span> Assemble official transcripts, reference letters, proof of language test scores, and Statement of Purpose.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-xs text-primary-700">3</span>
                  <div>
                    <span className="font-bold text-gray-900">Apply for University Admission:</span> Secure an unconditional or conditional offer letter if university nomination is required.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-xs text-primary-700">4</span>
                  <div>
                    <span className="font-bold text-gray-900">Submit Scholarship Form:</span> Complete the application through the official portal before the closing deadline.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-xs text-primary-700">5</span>
                  <div>
                    <span className="font-bold text-gray-900">Interview & Assessment:</span> Shortlisted candidates will be invited for online or embassy interviews.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-xs text-primary-700">6</span>
                  <div>
                    <span className="font-bold text-gray-900">Award Notification & Visa:</span> Successful applicants receive formal scholarship contracts and visa sponsorship letters.
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Right Sidebar: Key Facts & Required Documents */}
          <div className="space-y-6">
            {/* Quick Summary Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
                Key Opportunity Details
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-semibold text-gray-900">{scholarship.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Number of Awards:</span>
                  <span className="font-semibold text-gray-900">{scholarship.numAwards || 'Varies'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Application Fee:</span>
                  <span className="font-semibold text-gray-900">
                    {scholarship.applicationFee === 0 ? "Free ($0)" : `$${scholarship.applicationFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Application Deadline:</span>
                  <span className="font-semibold text-primary-600">{formatDate(scholarship.deadline)}</span>
                </div>
              </div>

              {scholarship.officialUrl ? (
                <a
                  href={scholarship.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <span>Visit Official Website</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>

            {/* Required Documents Checklist */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2 mb-3">
                Required Documents Checklist
              </h3>
              <ul className="space-y-2 text-xs text-gray-700">
                {scholarship.documentsRequired.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trust & Source Card */}
            <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-5 text-xs text-gray-600 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-primary-900">
                <ShieldCheck className="h-4 w-4 text-primary-600" />
                <span>Verified Official Source</span>
              </div>
              <p>
                Provider: <span className="font-semibold text-gray-900">{scholarship.providerName || "Verified Organization"}</span>
              </p>
              <p>
                Last verified: <span className="font-semibold text-gray-900">{formatDate(scholarship.lastVerifiedAt)}</span>
              </p>
              <p className="text-[11px] text-gray-500 pt-2 border-t border-primary-100">
                Disclaimer: Requirements can change. Always confirm directly on the official portal before applying.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
