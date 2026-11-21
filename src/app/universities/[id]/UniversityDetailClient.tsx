"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter as useAppRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  Clock,
  DollarSign,
  ExternalLink,
  Globe,
  GraduationCap,
  Image,
  List,
  MapPin,
  Shield,
  Star,
  Trophy,
  BookOpen,
  Search,
} from "lucide-react";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import { Container } from "@/components/layout/Layout";
import { fetchPublicScholarships } from "@/app/actions/public-actions";
import type { PublicUniversity, Paginated, PublicScholarship } from "@/lib/data/public";
import { SCHOLARSHIP_PAGE_SIZE } from "@/lib/page-size";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { UniversityImage } from "@/components/public/UniversityImage";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { RankingBadge } from "@/components/public/UniversityBadges";
import { Button } from "@/components/ui/Button";

interface UniversityDetailClientProps {
  university: PublicUniversity;
  initialScholarships: Paginated<PublicScholarship>;
  initialTab?: string;
}

type TabId =
  | "overview"
  | "courses"
  | "scholarships"
  | "fees"
  | "requirements"
  | "intakes"
  | "about";

interface TabSectionProps {
  active: boolean;
  children: React.ReactNode;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "scholarships", label: "Scholarships", icon: Star },
  { id: "fees", label: "Fees", icon: DollarSign },
  { id: "requirements", label: "Requirements", icon: Check },
  { id: "intakes", label: "Intakes", icon: Calendar },
  { id: "about", label: "About", icon: Globe },
];

const STUDY_LEVEL_MAP: Record<string, string> = {
  Undergraduate: "Undergraduate",
  "Master's": "Postgraduate",
  MBA: "Postgraduate",
  Doctoral: "Postgraduate",
  JD: "Postgraduate",
  MD: "Postgraduate",
  PhD: "PhD",
  Postdoctoral: "Postgraduate",
  Research: "Postgraduate",
  "Professional Fellowship": "Postgraduate",
};

function scholarshipStudyLevels(s: PublicScholarship): string[] {
  const seen = new Set<string>();
  for (const level of s.degreeLevels) {
    const label = STUDY_LEVEL_MAP[level];
    if (label) seen.add(label);
  }
  return [...seen];
}

function scholarshipIntakeName(s: PublicScholarship): string {
  return s.intake || "Not stated";
}

function TabSection({ active, children }: TabSectionProps) {
  return <div className={cn(!active && "hidden")}>{children}</div>;
}

export function UniversityDetailClient({
  university,
  initialScholarships,
  initialTab,
}: UniversityDetailClientProps) {
  const router = useAppRouter();

  const validTabIds = new Set(TABS.map((t) => t.id));
  const [tab, setTab] = useState<TabId>(
    validTabIds.has((initialTab ?? "overview") as TabId)
      ? (initialTab as TabId)
      : "overview"
  );

  const navigateTab = useCallback(
    (next: TabId) => {
      setTab(next);
      const params = new URLSearchParams(window.location.search);
      params.set("tab", next);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const [scholarships, setScholarships] = useState<Paginated<PublicScholarship>>(
    initialScholarships
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortOption, setSortOption] = useState("deadline");

  const loadScholarships = async (
    pageNum: number = 1,
    sort: string = sortOption
  ) => {
    setLoading(true);
    try {
      const res = await fetchPublicScholarships({
        university: university.id,
        limit: SCHOLARSHIP_PAGE_SIZE,
        page: pageNum,
        sort: sort as "deadline" | "newest" | "title" | "featured",
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

  const countryLabel =
    university.city && university.country
      ? `${university.city}, ${university.country}`
      : university.country || university.city || "Not stated";

  const distinctIntakes = useMemo(() => {
    const seen = new Set<string>();
    for (const s of scholarships.data) {
      const name = scholarshipIntakeName(s);
      if (name && name !== "Not stated") seen.add(name);
    }
    return [...seen].sort();
  }, [scholarships.data]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <section className="relative bg-gradient-to-b from-primary-50 via-white to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-4 pointer-events-none" />
        <Container>
          <div className="py-10 lg:py-16">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Academic Institution</span>
              </span>
              {university.featured && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>Featured</span>
                </span>
              )}
              {university.type && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
                  <Shield className="h-3.5 w-3.5" />
                  <span>{university.type}</span>
                </span>
              )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {university.coverImage ? (
                      <UniversityImage
                        src={university.coverImage}
                        alt={`Campus of ${university.name}`}
                        initials={university.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UniversityImage
                        src={null}
                        alt={university.name}
                        initials={university.name}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 leading-tight line-clamp-2">
                      {university.name}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {countryLabel}
                      </span>
                      {university.establishedYear && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>Founded {university.establishedYear}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {(university.qsRanking || university.theRanking) && (
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    {university.qsRanking && (
                      <RankingBadge ranking={university.qsRanking} source="qs" />
                    )}
                    {university.theRanking && (
                      <RankingBadge ranking={university.theRanking} source="the" />
                    )}
                  </div>
                )}
              </div>

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
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-gray-800 w-full sm:w-auto justify-center"
                >
                  <Star className="h-4 w-4" />
                  View {university.scholarshipCount} Scholarships
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-200 bg-white">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
            <StatBlock
              label="Total students"
              value={university.studentCount ? formatNumber(university.studentCount) : "Not available"}
            />
            <StatBlock
              label="International students"
              value={
                university.internationalStudentPercent != null
                  ? `${university.internationalStudentPercent}%`
                  : university.internationalStudentCount != null
                    ? formatNumber(university.internationalStudentCount)
                    : "Not available"
              }
            />
            <StatBlock label="Available scholarships" value={university.scholarshipCount} accent />
            <StatBlock label="Fields of study" value={university.popularFields.length} />
          </div>
        </Container>
      </section>

      {/* Tabs */}
      <Container className="py-10 lg:py-14">
        <nav className="flex flex-col gap-1" aria-label="University profile sections">
          <div className="overflow-x-auto border-b border-gray-200 bg-white/60 backdrop-blur-md sticky top-0 z-10 -mb-px">
            <div className="flex h-[48px] items-center gap-0 lg:gap-1">
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => navigateTab(t.id)}
                    className={cn(
                      "flex flex-shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2",
                      active
                        ? "bg-primary-50 border-primary-600 text-primary-700"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                    aria-current={active ? "true" : undefined}
                  >
                    <t.icon className="h-4 w-4" />
                    <span className="line-clamp-1">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <TabSection active={tab === "overview"}>
              <OverviewSection university={university} />
            </TabSection>
            <TabSection active={tab === "courses"}>
              <CoursesSection university={university} />
            </TabSection>
            <TabSection active={tab === "scholarships"}>
              <ScholarshipsTab
                university={university}
                scholarships={scholarships}
                loading={loading}
                page={page}
                totalPages={scholarships.totalPages}
                sortOption={sortOption}
                loadScholarships={loadScholarships}
                handleSortChange={handleSortChange}
              />
            </TabSection>
            <TabSection active={tab === "fees"}>
              <TuitionSection university={university} />
            </TabSection>
            <TabSection active={tab === "requirements"}>
              <RequirementsSection university={university} />
            </TabSection>
            <TabSection active={tab === "intakes"}>
              <IntakesSection intakes={distinctIntakes} university={university} />
            </TabSection>
            <TabSection active={tab === "about"}>
              <AboutSection university={university} />
            </TabSection>
          </div>
        </nav>
      </Container>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared stat block                                                  */
/* ------------------------------------------------------------------ */

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div className={cn("text-2xl sm:text-3xl font-extrabold mb-1", accent ? "text-primary-600" : "text-gray-950")}>
        {value}
      </div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                           */
/* ------------------------------------------------------------------ */

function OverviewSection({ university }: { university: PublicUniversity }) {
  return (
    <section aria-labelledby="overview-heading" className="space-y-6">
      <h2 id="overview-heading" className="sr-only">Overview</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: About the University */}
        <div className="lg:col-span-1">
          <article className="rounded-xl border border-gray-200 bg-white p-6 h-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary-600" />
              About the University
            </h3>
            {university.description ? (
              <div className="prose prose-gray max-w-none text-gray-700 mb-6">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{university.description}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-6">
                A university overview is not published yet.
              </p>
            )}

            {/* Key Facts */}
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Key Facts</h4>
              {university.qsRanking && (
                <QuickFact label="QS World Ranking" value={`#${university.qsRanking}`} />
              )}
              {university.theRanking && (
                <QuickFact label="THE World Ranking" value={`#${university.theRanking}`} />
              )}
              <QuickFact
                label="International Students"
                value={
                  university.internationalStudentPercent != null
                    ? `${university.internationalStudentPercent}%`
                    : university.internationalStudentCount != null
                      ? formatNumber(university.internationalStudentCount)
                      : "Not available"
                }
              />
              <QuickFact
                label="Total Students"
                value={
                  university.studentCount
                    ? formatNumber(university.studentCount)
                    : "Not available"
                }
              />
              {university.establishedYear && (
                <QuickFact label="Established" value={university.establishedYear} />
              )}
              {university.type && (
                <QuickFact label="University Type" value={university.type} />
              )}
            </div>

            {/* Visit Official Website Button */}
            {university.website && (
              <a
                href={university.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 w-full justify-center"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Official Website
              </a>
            )}
          </article>
        </div>

        {/* Column 2: Available Scholarships */}
        <div className="lg:col-span-1">
          <article className="rounded-xl border border-gray-200 bg-white p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary-600" />
                Available Scholarships
              </h3>
              <span className="inline-flex items-center justify-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-700">
                {university.scholarshipCount}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Scholarships offered by {university.name}
            </p>
            {university.scholarshipCount > 0 ? (
              <>
                <div className="space-y-3 mb-6">
                  {university.scholarships?.slice(0, 5).map((scholarship, index) => (
                    <Link
                      key={index}
                      href={`/scholarships/${scholarship.slug || scholarship.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {scholarship.title || `Scholarship ${index + 1}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {university.countryCode && (
                            <CountryFlag
                              code={university.countryCode}
                              name={university.country}
                              size="xs"
                            />
                          )}
                          <span className="text-xs text-gray-500">
                            {scholarship.fundingType?.replace("-", " ") || "Funding available"}
                          </span>
                          {scholarship.deadline && (
                            <span className="text-xs text-gray-500">
                              • {formatDate(scholarship.deadline)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/scholarships?university=${university.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  View All Scholarships
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-6 text-center">
                <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No scholarships currently listed for this university.
                </p>
              </div>
            )}
          </article>
        </div>

        {/* Column 3: Quick Information */}
        <div className="lg:col-span-1">
          <article className="rounded-xl border border-gray-200 bg-white p-6 h-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              Quick Information
            </h3>
            <div className="space-y-3 mb-6">
              <QuickFact
                label="Location"
                value={
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {university.city || "Not stated"}, {university.country}
                  </span>
                }
              />
              {university.type && (
                <QuickFact
                  label="University Type"
                  value={
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      {university.type}
                    </span>
                  }
                />
              )}
              {university.establishedYear && (
                <QuickFact
                  label="Established"
                  value={
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {university.establishedYear}
                    </span>
                  }
                />
              )}
              <QuickFact
                label="Country"
                value={
                  <span className="flex items-center gap-2">
                    <CountryFlag
                      code={university.countryCode}
                      name={university.country}
                      size="xs"
                    />
                    {university.country}
                  </span>
                }
              />
              <QuickFact
                label="City"
                value={
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {university.city || "Not stated"}
                  </span>
                }
              />
              {university.address && (
                <QuickFact
                  label="Campus Address"
                  value={
                    <span className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
                      {university.address}
                    </span>
                  }
                />
              )}
            </div>

            {/* Map Preview */}
            {university.latitude && university.longitude && (
              <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                <div className="aspect-[16/9] bg-gray-100 relative">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${university.longitude - 0.01},${university.latitude - 0.01},${university.longitude + 0.01},${university.latitude + 0.01}&layer=mapnik&marker=${university.latitude},${university.longitude}`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title={`Map showing ${university.name} location`}
                  />
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared components                                                  */
/* ------------------------------------------------------------------ */

function QuickFact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-gray-50 pb-2 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
        {label}
      </dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

function cityLine(university: PublicUniversity): string {
  return university.city ? university.city : "Location not stated";
}

/* ------------------------------------------------------------------ */
/* Courses                                                            */
/* ------------------------------------------------------------------ */

function CoursesSection({ university }: { university: PublicUniversity }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const filteredFields = university.popularFields.filter((field) =>
    field.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const levels = [
    { value: "all", label: "All Levels" },
    { value: "undergraduate", label: "Undergraduate" },
    { value: "postgraduate", label: "Postgraduate" },
    { value: "phd", label: "PhD" },
  ];

  return (
    <section aria-labelledby="courses-heading" className="space-y-6">
      <h2 id="courses-heading" className="sr-only">Available Courses</h2>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses and subjects..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {levels.map((level) => (
            <button
              key={level.value}
              onClick={() => setLevelFilter(level.value)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                levelFilter === level.value
                  ? "bg-primary-100 text-primary-700 border border-primary-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              )}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Course List */}
      {filteredFields.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary-600" />
              Popular Courses &amp; Subject Areas
            </h3>
            <span className="text-sm text-gray-500">
              {filteredFields.length} courses
            </span>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            Subject areas taught at {university.name}, based on published
            programme information.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFields.map((field) => (
              <div
                key={field}
                className="rounded-lg border border-gray-200 bg-white p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900">{field}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {levelFilter === "all"
                        ? "Multiple levels available"
                        : levelFilter === "undergraduate"
                          ? "Undergraduate program"
                          : levelFilter === "postgraduate"
                            ? "Postgraduate program"
                            : "PhD program"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Courses are based on published program information. Contact the university for the most up-to-date course offerings.
            </p>
          </div>
        </div>
      ) : (
        <EmptySection
          message={searchTerm
            ? `No courses found matching "${searchTerm}". Try a different search term.`
            : "No courses or subject areas are published for this university."}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Fees                                                               */
/* ------------------------------------------------------------------ */

function TuitionSection({ university }: { university: PublicUniversity }) {
  return (
    <section aria-labelledby="tuition-heading" className="space-y-4">
      <h2 id="tuition-heading" className="sr-only">Tuition Fees</h2>
      {university.tuitionInfo ? (
        <article className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary-600" />
            Tuition &amp; Fees
          </h3>
          <div className="prose prose-sm prose-gray max-w-none text-gray-700 mb-4">
            <p className="whitespace-pre-wrap">{university.tuitionInfo}</p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Fee Structure</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <GraduationCap className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Undergraduate</p>
                  <p className="text-gray-600 text-xs mt-0.5">See tuition info above</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BookOpen className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Postgraduate</p>
                  <p className="text-gray-600 text-xs mt-0.5">See tuition info above</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">International Students</p>
                  <p className="text-gray-600 text-xs mt-0.5">Varies by program</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Academic Year</p>
                  <p className="text-gray-600 text-xs mt-0.5">2024-2025</p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Fees vary by programme and residency status. Confirm the exact
            cost on the official university website.
          </p>
        </article>
      ) : (
        <EmptySection
          message="Tuition and fee information is not published for this university."
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Scholarships tab                                                   */
/* ------------------------------------------------------------------ */

interface ScholarshipsTabProps {
  university: PublicUniversity;
  scholarships: Paginated<PublicScholarship>;
  loading: boolean;
  page: number;
  totalPages: number;
  sortOption: string;
  loadScholarships: (pageNum?: number, sort?: string) => Promise<void>;
  handleSortChange: (newSort: string) => void;
}

function ScholarshipsTab({
  university,
  scholarships,
  loading,
  page,
  totalPages,
  sortOption,
  loadScholarships,
  handleSortChange,
}: ScholarshipsTabProps) {
  return (
    <section aria-labelledby="scholarships-heading" className="space-y-6">
      <h2 id="scholarships-heading" className="sr-only">Scholarships</h2>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary-600" />
            Scholarships at {university.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {scholarships.total} scholarship{scholarships.total === 1 ? "" : "s"} published by this university
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="profile-scholarship-sort" className="text-xs text-gray-500 font-medium hidden sm:block">
            Sort by:
          </label>
          <select
            id="profile-scholarship-sort"
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white py-1.5 px-2.5 text-xs font-medium text-gray-800 focus:border-primary-500 focus:outline-none"
          >
            <option value="deadline">Upcoming deadline</option>
            <option value="title">Alphabetical (A-Z)</option>
            <option value="featured">Featured first</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-white border border-gray-200 animate-pulse p-4" />
          ))}
        </div>
      ) : scholarships.data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">No scholarships found</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
            This university doesn&rsquo;t have any published scholarships at the
            moment.
          </p>
          <Link
            href="/scholarships"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Browse all scholarships
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {scholarships.data.map((sch) => (
              <ScholarshipRow key={sch.id} scholarship={sch} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => loadScholarships(page - 1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-gray-600 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => loadScholarships(page + 1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href={`/scholarships?university=${university.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              View all {university.scholarshipCount} scholarships
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function ScholarshipRow({ scholarship }: { scholarship: PublicScholarship }) {
  const urgency = getDeadlineUrgency(scholarship.deadline);
  return (
    <article className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex-1 min-w-0">
        <Link
          href={`/scholarships/${scholarship.slug}`}
          className="text-sm font-semibold text-gray-900 line-clamp-1 hover:text-primary-600"
          title={scholarship.title}
        >
          {scholarship.title}
        </Link>
        <p className="mt-1 text-xs text-gray-500">
          {scholarship.providerName || "Official Provider"}
          {scholarship.universityName && ` • ${scholarship.universityName}`}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-600">
            {scholarship.fundingType.replace("-", " ")}
          </span>
          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-600">
            {scholarshipStudyLevels(scholarship).join(", ") || "All levels"}
          </span>
          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-600">
            {scholarshipIntakeName(scholarship)}
          </span>
        </div>
      </div>
      <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-col sm:flex-row sm:items-end gap-2 text-right sm:text-left">
        <div className="text-xs font-semibold text-gray-900">
          {scholarship.fundingAmount ? (
            <>
              {formatCurrency(scholarship.fundingAmount, scholarship.currency ?? "USD")}
              {scholarship.monthlyStipend && (
                <>
                  <br />
                  <span className="text-gray-500 font-normal">
                    + {formatCurrency(scholarship.monthlyStipend, scholarship.currency ?? "USD")}/mo
                  </span>
                </>
              )}
            </>
          ) : scholarship.monthlyStipend ? (
            formatCurrency(scholarship.monthlyStipend, scholarship.currency ?? "USD") + "/mo"
          ) : (
            "Amount not stated"
          )}
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 font-semibold",
              urgency === "closed"
                ? "bg-red-50 text-red-700 border-red-200"
                : urgency === "urgent"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-gray-50 text-gray-700 border-gray-200"
            )}
          >
            {formatDate(scholarship.deadline)}
          </span>
        </div>
        {scholarship.applicationUrl && (
          <a
            href={scholarship.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
          >
            Apply <ArrowRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}

function getDeadlineUrgency(deadline: string | null): string {
  if (!deadline) return "unknown";
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return "closed";
  if (days <= 7) return "urgent";
  if (days <= 15) return "soon";
  if (days <= 30) return "warning";
  return "safe";
}

/* ------------------------------------------------------------------ */
/* Requirements                                                       */
/* ------------------------------------------------------------------ */

function RequirementsSection({ university }: { university: PublicUniversity }) {
  return (
    <section aria-labelledby="requirements-heading" className="space-y-6">
      <h2 id="requirements-heading" className="sr-only">Admission Requirements</h2>

      {/* General Requirements */}
      {university.admissionInfo && (
        <article className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-primary-600" />
            General Admission Requirements
          </h3>
          <div className="prose prose-sm prose-gray max-w-none text-gray-700">
            <p className="whitespace-pre-wrap">{university.admissionInfo}</p>
          </div>
        </article>
      )}

      {/* English Language Requirements */}
      {(university.internationalInfo || university.admissionInfo) && (
        <article className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary-600" />
            English Language Requirements
          </h3>
          {university.internationalInfo ? (
            <div className="prose prose-sm prose-gray max-w-none text-gray-700">
              <p className="whitespace-pre-wrap">{university.internationalInfo}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              English language requirements are not published for this university.
              Check individual scholarship listings or the official admissions website
              for accepted tests and scores.
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
              <p className="text-xs text-gray-500 font-medium">IELTS</p>
              <p className="text-lg font-bold text-gray-900 mt-1">6.5+</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
              <p className="text-xs text-gray-500 font-medium">TOEFL</p>
              <p className="text-lg font-bold text-gray-900 mt-1">90+</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
              <p className="text-xs text-gray-500 font-medium">PTE</p>
              <p className="text-lg font-bold text-gray-900 mt-1">62+</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
              <p className="text-xs text-gray-500 font-medium">Duolingo</p>
              <p className="text-lg font-bold text-gray-900 mt-1">120+</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Requirements may vary by program. Check specific course pages for details.
          </p>
        </article>
      )}

      {/* Required Documents */}
      <article className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <List className="h-5 w-5 text-primary-600" />
          Required Documents
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            "Academic Transcripts",
            "Degree Certificates",
            "English Language Test Results",
            "Personal Statement",
            "Letters of Recommendation",
            "Passport Copy",
            "CV / Resume",
            "Portfolio (if applicable)",
          ].map((doc) => (
            <div key={doc} className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              {doc}
            </div>
          ))}
        </div>
      </article>

      {!university.admissionInfo && !university.internationalInfo && (
        <EmptySection
          message="Admission requirements are not published for this university."
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* English language                                                   */
/* ------------------------------------------------------------------ */

function EnglishSection({
  university,
  scholarships,
}: {
  university: PublicUniversity;
  scholarships: PublicScholarship[];
}) {
  const hasUniversityLevel = Boolean(university.internationalInfo);
  const testReqs = scholarships.reduce<string[]>(
    (acc, s) => [...acc, ...(s.languageReqs ?? [])],
    []
  );
  return (
    <section aria-labelledby="english-heading" className="space-y-4">
      <h2 id="english-heading" className="sr-only">English Language Requirements</h2>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary-600" />
          English Language Requirements
        </h3>
        {hasUniversityLevel ? (
          <div className="prose prose-sm prose-gray max-w-none text-gray-700">
            <p className="whitespace-pre-wrap">{university.internationalInfo}</p>
          </div>
        ) : testReqs.length > 0 ? (
          <p className="text-sm text-gray-700">
            University-wide English requirements are not published. Published
            scholarships at this university require:{" "}
            {[...new Set(testReqs)].join(", ")}.
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            English language requirements are not published for this
            university. Check individual scholarship listings or the official
            admissions website for accepted tests and scores.
          </p>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Intakes                                                            */
/* ------------------------------------------------------------------ */

function IntakesSection({
  intakes,
  university,
}: {
  intakes: string[];
  university: PublicUniversity;
}) {
  return (
    <section aria-labelledby="intakes-heading" className="space-y-6">
      <h2 id="intakes-heading" className="sr-only">Available Intakes</h2>

      {intakes.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Available Intakes
            </h3>
            <span className="text-sm text-gray-500">
              {intakes.length} intake{intakes.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            Admission intakes with published scholarships at {university.name}.
          </p>

          <div className="space-y-3">
            {intakes.map((name, index) => {
              // Determine status based on intake name (simplified logic)
              const isUpcoming = name.toLowerCase().includes("2025") || name.toLowerCase().includes("2026") || name.toLowerCase().includes("2027");
              const status = isUpcoming ? "upcoming" : "open";

              return (
                <div
                  key={name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {university.name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
                      status === "open"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        status === "open" ? "bg-green-500" : "bg-blue-500"
                      )}
                    />
                    {status === "open" ? "Open" : "Upcoming"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Intake availability and application deadlines may vary. Check the official university website for the most current information.
            </p>
          </div>
        </div>
      ) : (
        <EmptySection message="No published intakes are listed for this university." />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* About                                                              */
/* ------------------------------------------------------------------ */

function AboutSection({ university }: { university: PublicUniversity }) {
  const hasContact =
    university.contactEmail || university.contactPhone || university.address;

  return (
    <section aria-labelledby="about-heading" className="space-y-6">
      <h2 id="about-heading" className="sr-only">About the University</h2>

      {/* University Overview */}
      <article className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary-600" />
          About {university.name}
        </h3>
        {university.description ? (
          <div className="prose prose-sm prose-gray max-w-none text-gray-700 mb-6">
            <p className="whitespace-pre-wrap">{university.description}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-6">
            A detailed overview is not published for this university.
          </p>
        )}

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {university.establishedYear && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Founded</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{university.establishedYear}</p>
            </div>
          )}
          {university.type && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Type</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{university.type}</p>
            </div>
          )}
          {university.studentCount && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Students</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatNumber(university.studentCount)}</p>
            </div>
          )}
          {university.internationalStudentPercent != null && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">International</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{university.internationalStudentPercent}%</p>
            </div>
          )}
          {university.acceptanceRate != null && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Acceptance Rate</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{university.acceptanceRate}%</p>
            </div>
          )}
          {university.qsRanking && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">QS Ranking</p>
              <p className="text-lg font-bold text-gray-900 mt-1">#{university.qsRanking}</p>
            </div>
          )}
        </div>

        {/* Official Website & Admissions */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Official Links</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            {university.website && (
              <a
                href={university.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Official Website
              </a>
            )}
            {university.admissionsWebsite && (
              <a
                href={university.admissionsWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
              >
                <GraduationCap className="h-4 w-4" />
                Admissions Portal
              </a>
            )}
            {!university.website && !university.admissionsWebsite && (
              <p className="text-sm text-gray-500">
                No official website link is published for this university.
              </p>
            )}
          </div>
        </div>
      </article>

      {/* Campus & Facilities */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Location & Contact */}
        <article className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            Location & Contact
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="shrink-0 text-gray-400 mt-0.5">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="text-sm">
                <p className="text-gray-900">
                  {university.address ? university.address : cityLine(university)}
                </p>
                <p className="mt-1 text-gray-500">{university.country}</p>
              </div>
            </div>
            {university.contactEmail && (
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-gray-400 mt-0.5">
                  <Globe className="h-4 w-4" />
                </span>
                <div className="text-sm">
                  <a
                    href={`mailto:${university.contactEmail}`}
                    className="text-primary-600 hover:underline"
                  >
                    {university.contactEmail}
                  </a>
                </div>
              </div>
            )}
            {university.contactPhone && (
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-gray-400 mt-0.5">
                  <Globe className="h-4 w-4" />
                </span>
                <div className="text-sm">
                  <a
                    href={`tel:${university.contactPhone}`}
                    className="text-gray-900"
                  >
                    {university.contactPhone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Campus Images */}
        <article className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Image className="h-5 w-5 text-primary-600" />
            Campus Gallery
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {university.coverImage && (
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-[4/3]">
                <UniversityImage
                  src={university.coverImage}
                  alt={`${university.name} campus`}
                  initials={university.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {university.logo && (
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-[4/3]">
                <UniversityImage
                  src={university.logo}
                  alt={`${university.name} logo`}
                  initials={university.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
