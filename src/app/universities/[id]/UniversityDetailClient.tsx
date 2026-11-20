"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Globe, MapPin, Award, Users, Calendar, DollarSign, Link2, ExternalLink, Star, GraduationCap, Shield, ArrowRight, Check, X, ChevronRight, University, Trophy, Flag, MapPin as MapPinIcon } from "lucide-react";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import { Container } from "@/components/layout/Layout";
import { fetchPublicScholarships } from "@/app/actions/public-actions";
import type { PublicUniversity, Paginated, PublicScholarship } from "@/lib/data/public";
import { SCHOLARSHIP_PAGE_SIZE } from "@/lib/page-size";

interface UniversityDetailClientProps {
  university: PublicUniversity;
  initialScholarships: Paginated<PublicScholarship>;
}

export function UniversityDetailClient({ university, initialScholarships }: UniversityDetailClientProps) {
  const [scholarships, setScholarships] = useState<Paginated<PublicScholarship>>(initialScholarships);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortOption, setSortOption] = useState("deadline");

  const loadScholarships = async (pageNum: number = 1, sort: string = sortOption) => {
    setLoading(true);
    try {
      const res = await fetchPublicScholarships({
        university: university.id,
        limit: SCHOLARSHIP_PAGE_SIZE,
        page: pageNum,
        sort: sort as any,
      });
      setScholarships(res);
      setPage(pageNum);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSort: string) => {
    setSortOption(newSort);
    loadScholarships(1, newSort);
  };

  const getRankingBadge = (ranking: number | null) => {
    if (!ranking) return null;
    if (ranking <= 10) return { label: `Top ${ranking}`, color: "bg-amber-100 text-amber-800 border-amber-300" };
    if (ranking <= 50) return { label: `Top ${ranking}`, color: "bg-blue-100 text-blue-800 border-blue-300" };
    if (ranking <= 100) return { label: `Rank ${ranking}`, color: "bg-green-100 text-green-800 border-green-300" };
    if (ranking <= 500) return { label: `Rank ${ranking}`, color: "bg-gray-100 text-gray-800 border-gray-300" };
    return { label: `Rank ${ranking}`, color: "bg-gray-100 text-gray-600 border-gray-200" };
  };

  const formatNumber = (num: number | null) => {
    if (!num) return "Not available";
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return "Not available";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 via-white to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <Container>
          <div className="py-12 lg:py-16">
            {/* Header Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Academic Institution</span>
              </span>
              {university.featured && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  Featured
                </span>
              )}
              {university.type && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  <Shield className="h-3.5 w-3.5" />
                  {university.type}
                </span>
              )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
              <div className="flex-1">
                {/* Logo and Name */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {university.logo ? (
                      <img
                        src={university.logo}
                        alt={university.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 leading-tight">
                      {university.name}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {university.city && `${university.city}, `}{university.country}
                      </span>
                      {university.establishedYear && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          Est. {university.establishedYear}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rankings */}
                {(university.qsRanking || university.theRanking) && (
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {university.qsRanking && (
                      <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold border ${getRankingBadge(university.qsRanking)?.color}`}>
                        <Trophy className="h-4 w-4" />
                        QS World Ranking: #{university.qsRanking}
                      </span>
                    )}
                    {university.theRanking && (
                      <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold border ${getRankingBadge(university.theRanking)?.color}`}>
                        <Award className="h-4 w-4" />
                        THE Ranking: #{university.theRanking}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                {university.website && (
                  <a
                    href={university.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-primary-700 w-full sm:w-auto justify-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Official Website
                  </a>
                )}
                {university.admissionsWebsite && (
                  <a
                    href={university.admissionsWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-xs transition-all hover:bg-gray-50 w-full sm:w-auto justify-center"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Admissions
                  </a>
                )}
                <Link
                  href={`/scholarships?university=${university.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-gray-700 w-full sm:w-auto justify-center"
                >
                  <Award className="h-4 w-4" />
                  View {university.scholarshipCount} Scholarships
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-200 bg-white">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-950">
                {formatNumber(university.studentCount)}
              </div>
              <div className="text-xs text-gray-500 font-medium">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-950">
                {university.internationalStudentPercent 
                  ? `${university.internationalStudentPercent}%` 
                  : formatNumber(university.internationalStudentCount)}
              </div>
              <div className="text-xs text-gray-500 font-medium">International Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-950">
                {university.scholarshipCount}
              </div>
              <div className="text-xs text-gray-500 font-medium">Scholarships</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-950">
                {university.popularFields?.length || 0}
              </div>
              <div className="text-xs text-gray-500 font-medium">Study Fields</div>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Container className="py-10 lg:py-14">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {university.description && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary-600" />
                  About {university.name}
                </h2>
                <div className="prose prose-gray max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{university.description}</p>
                </div>
              </section>
            )}

            {/* Details Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Admissions Info */}
              {university.admissionInfo && (
                <article className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary-600" />
                    Admissions Information
                  </h3>
                  <div className="prose prose-sm prose-gray max-w-none text-gray-700">
                    <p className="whitespace-pre-wrap">{university.admissionInfo}</p>
                  </div>
                </article>
              )}

              {/* Tuition Info */}
              {university.tuitionInfo && (
                <article className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary-600" />
                    Tuition & Fees
                  </h3>
                  <div className="prose prose-sm prose-gray max-w-none text-gray-700">
                    <p className="whitespace-pre-wrap">{university.tuitionInfo}</p>
                  </div>
                </article>
              )}

              {/* International Students Info */}
              {university.internationalInfo && (
                <article className="rounded-2xl border border-gray-200 bg-white p-6 md:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary-600" />
                    International Student Support
                  </h3>
                  <div className="prose prose-sm prose-gray max-w-none text-gray-700">
                    <p className="whitespace-pre-wrap">{university.internationalInfo}</p>
                  </div>
                </article>
              )}

              {/* Popular Fields */}
              {university.popularFields && university.popularFields.length > 0 && (
                <article className="rounded-2xl border border-gray-200 bg-white p-6 md:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <University className="h-5 w-5 text-primary-600" />
                    Popular Fields of Study
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {university.popularFields.map((field, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 border border-primary-100"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </article>
              )}
            </section>

            {/* Scholarships Section */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary-600" />
                    Scholarships at {university.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {university.scholarshipCount} scholarship{university.scholarshipCount !== 1 ? "s" : ""} available for international students
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="scholarship-sort" className="text-sm text-gray-500 font-medium">
                    Sort by:
                  </label>
                  <select
                    id="scholarship-sort"
                    value={sortOption}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 px-2.5 text-sm font-medium text-gray-800 focus:border-primary-500 focus:outline-none"
                  >
                    <option value="deadline">Upcoming Deadline</option>
                    <option value="alphabetical">Alphabetical (A-Z)</option>
                    <option value="featured">Featured First</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-72 rounded-2xl bg-white border border-gray-200 animate-pulse p-5" />
                  ))}
                </div>
              ) : scholarships.data.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-900">No scholarships found</h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                    This university doesn't have any published scholarships at the moment.
                  </p>
                  <Link
                    href="/scholarships"
                    className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Browse all scholarships
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {scholarships.data.map((sch) => (
                      <ScholarshipCard key={sch.id} scholarship={sch} />
                    ))}
                  </div>

                  {scholarships.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => loadScholarships(page - 1)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="text-xs font-semibold text-gray-600 px-2">
                        Page {page} of {scholarships.totalPages}
                      </span>
                      <button
                        disabled={page === scholarships.totalPages}
                        onClick={() => loadScholarships(page + 1)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  )}

                  <div className="mt-6 text-center">
                    <Link
                      href={`/scholarships?university=${university.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
                    >
                      View all {university.scholarshipCount} scholarships
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Quick Facts Card */}
            <article className="rounded-2xl border border-gray-200 bg-white p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary-600" />
                Quick Facts
              </h3>
              <dl className="space-y-4">
                {university.city && (
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">City</dt>
                      <dd className="text-sm text-gray-900">{university.city}</dd>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Flag className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">Country</dt>
                    <dd className="text-sm text-gray-900">{university.country}</dd>
                  </div>
                </div>
                {university.establishedYear && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">Founded</dt>
                      <dd className="text-sm text-gray-900">{university.establishedYear}</dd>
                    </div>
                  </div>
                )}
                {university.qsRanking && (
                  <div className="flex items-start gap-3">
                    <Trophy className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">QS Ranking</dt>
                      <dd className="text-sm font-bold text-gray-900">#{university.qsRanking}</dd>
                    </div>
                  </div>
                )}
                {university.theRanking && (
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">THE Ranking</dt>
                      <dd className="text-sm font-bold text-gray-900">#{university.theRanking}</dd>
                    </div>
                  </div>
                )}
                {university.type && (
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">Type</dt>
                      <dd className="text-sm text-gray-900">{university.type}</dd>
                    </div>
                  </div>
                )}
                {university.ownership && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ownership</dt>
                      <dd className="text-sm text-gray-900">{university.ownership}</dd>
                    </div>
                  </div>
                )}
                {university.studentCount && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Students</dt>
                      <dd className="text-sm text-gray-900">{formatNumber(university.studentCount)}</dd>
                    </div>
                  </div>
                )}
                {university.internationalStudentPercent && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">International %</dt>
                      <dd className="text-sm font-bold text-gray-900">{university.internationalStudentPercent}%</dd>
                    </div>
                  </div>
                )}
                {university.acceptanceRate && (
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">Acceptance Rate</dt>
                      <dd className="text-sm font-bold text-gray-900">{university.acceptanceRate}%</dd>
                    </div>
                  </div>
                )}
              </dl>

              {university.website && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <a
                    href={university.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Official Website
                  </a>
                </div>
              )}
            </article>

            {/* Contact Info */}
            {(university.contactEmail || university.contactPhone || university.address) && (
              <article className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary-600" />
                  Contact Information
                </h3>
                <dl className="space-y-3">
                  {university.contactEmail && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-medium text-gray-500 w-24 flex-shrink-0">Email</span>
                      <a href={`mailto:${university.contactEmail}`} className="text-sm text-primary-600 hover:underline">
                        {university.contactEmail}
                      </a>
                    </div>
                  )}
                  {university.contactPhone && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-medium text-gray-500 w-24 flex-shrink-0">Phone</span>
                      <a href={`tel:${university.contactPhone}`} className="text-sm text-gray-900">
                        {university.contactPhone}
                      </a>
                    </div>
                  )}
                  {university.address && (
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <address className="text-sm text-gray-900 not-italic">{university.address}</address>
                    </div>
                  )}
                </dl>
              </article>
            )}
          </aside>
        </div>
      </Container>
    </div>
  );
}