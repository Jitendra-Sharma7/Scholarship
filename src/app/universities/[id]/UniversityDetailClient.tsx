"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  | "campus"
  | "location"
  | "rankings"
  | "courses"
  | "undergraduate"
  | "postgraduate"
  | "tuition"
  | "scholarships"
  | "entry"
  | "english"
  | "intakes"
  | "deadlines"
  | "website";

interface TabSectionProps {
  active: boolean;
  children: React.ReactNode;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "campus", label: "Campus Images", icon: Image },
  { id: "location", label: "Location & Contact", icon: MapPin },
  { id: "rankings", label: "Rankings", icon: Trophy },
  { id: "courses", label: "Available Courses", icon: BookOpen },
  {
    id: "undergraduate",
    label: "Undergraduate Programmes",
    icon: GraduationCap,
  },
  {
    id: "postgraduate",
    label: "Postgraduate Programmes",
    icon: List,
  },
  { id: "tuition", label: "Tuition Fees", icon: DollarSign },
  { id: "scholarships", label: "Scholarships", icon: Star },
  { id: "entry", label: "Entry Requirements", icon: Check },
  { id: "english", label: "English Language Requirements", icon: Globe },
  { id: "intakes", label: "Available Intakes", icon: Calendar },
  { id: "deadlines", label: "Application Deadlines", icon: Clock },
  { id: "website", label: "Official Website", icon: ExternalLink },
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

  // Keep the tab in the URL so a direct link (and the browser back button)
  // opens the right section without reloading the page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const current = params.get("tab");
    if (current && validTabIds.has(current as TabId) && current !== tab) {
      setTab(current as TabId);
    }
  }, []);

  const navigateTab = useCallback(
    (next: TabId) => {
      setTab(next);
      const params = new URLSearchParams(window.location.search);
      params.set("tab", next);
      router.replace(`?${params.toString()}`, undefined, { scroll: false });
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

  const countryLabel =
    university.city && university.country
      ? `${university.city}, ${university.country}`
      : university.country || university.city || "Not stated";

  const scholarshipsByLevel = useMemo(() => {
    const byLevel: Record<string, PublicScholarship[]> = {
      undergraduate: [],
      postgraduate: [],
      phd: [],
    };
    for (const s of scholarships.data) {
      const levels = scholarshipStudyLevels(s);
      if (levels.includes("Undergraduate")) byLevel.undergraduate.push(s);
      if (levels.includes("Postgraduate")) byLevel.postgraduate.push(s);
      if (levels.includes("PhD")) byLevel.phd.push(s);
    }
    return byLevel;
  }, [scholarships.data]);

  const distinctIntakes = useMemo(() => {
    const seen = new Set<string>();
    for (const s of scholarships.data) {
      const name = scholarshipIntakeName(s);
      if (name && name !== "Not stated") seen.add(name);
    }
    return [...seen].sort();
  }, [scholarships.data]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return [...scholarships.data]
      .filter((s) => s.deadline && new Date(s.deadline) > now)
      .sort(
        (a, b) =>
          new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
      )
      .slice(0, 8);
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
            <TabSection active={tab === "campus"}>
              <CampusSection university={university} />
            </TabSection>
            <TabSection active={tab === "location"}>
              <LocationSection university={university} />
            </TabSection>
            <TabSection active={tab === "rankings"}>
              <RankingsSection university={university} />
            </TabSection>
            <TabSection active={tab === "courses"}>
              <CoursesSection university={university} />
            </TabSection>
            <TabSection active={tab === "undergraduate"}>
              <UndergraduateSection
                scholarships={scholarshipsByLevel.undergraduate}
                university={university}
              />
            </TabSection>
            <TabSection active={tab === "postgraduate"}>
              <PostgraduateSection
                scholarships={scholarshipsByLevel.postgraduate}
                university={university}
              />
            </TabSection>
            <TabSection active={tab === "tuition"}>
              <TuitionSection university={university} />
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
            <TabSection active={tab === "entry"}>
              <EntrySection university={university} />
            </TabSection>
            <TabSection active={tab === "english"}>
              <EnglishSection
                university={university}
                scholarships={scholarships.data}
              />
            </TabSection>
            <TabSection active={tab === "intakes"}>
              <IntakesSection intakes={distinctIntakes} university={university} />
            </TabSection>
            <TabSection active={tab === "deadlines"}>
              <DeadlinesSection deadlines={upcomingDeadlines} university={university} />
            </TabSection>
            <TabSection active={tab === "website"}>
              <WebsiteSection university={university} />
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
      <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-6">
        <div className="lg:col-span-3">
          {university.description ? (
            <article className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary-600" />
                About {university.name}
              </h3>
              <div className="prose prose-gray max-w-none text-gray-700">
                <p className="whitespace-pre-wrap">{university.description}</p>
              </div>
            </article>
          ) : (
            <article className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
              A university overview is not published yet.
            </article>
          )}
        </div>
        <aside className="lg:col-span-1 space-y-6">
          <QuickFact
            label="Country"
            value={
              <span className="flex items-center gap-2">
                <CountryFlag
                  code={university.countryCode}
                  name={university.country}
                  size="sm"
                />
                {university.country}
              </span>
            }
          />
          <QuickFact label="City" value={university.city || "Not stated"} />
          {university.type && <QuickFact label="Type" value={university.type} />}
          {university.ownership && (
            <QuickFact label="Ownership" value={university.ownership} />
          )}
          {university.establishedYear && (
            <QuickFact label="Founded" value={university.establishedYear} />
          )}
          <QuickFact
            label="Total students"
            value={
              university.studentCount ? (
                <span className="font-semibold text-gray-900">
                  {formatNumber(university.studentCount)}
                </span>
              ) : (
                <span className="text-gray-500">Not available</span>
              )
            }
          />
          {university.internationalStudentPercent != null && (
            <QuickFact
              label="International students"
              value={
                <span className="font-semibold text-gray-900">
                  {university.internationalStudentPercent}%
                </span>
              }
            />
          )}
          {university.acceptanceRate != null && (
            <QuickFact
              label="Acceptance rate"
              value={
                <span className="font-semibold text-gray-900">
                  {university.acceptanceRate}%
                </span>
              }
            />
          )}
          <QuickFact
            label="Available scholarships"
            value={
              <span className={cn("font-semibold", university.scholarshipCount > 0 ? "text-primary-700" : "text-gray-500")}>
                {university.scholarshipCount}
              </span>
            }
          />
        </aside>
      </div>
    </section>
  );
}

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

/* ------------------------------------------------------------------ */
/* Campus images                                                      */
/* ------------------------------------------------------------------ */

function CampusSection({ university }: { university: PublicUniversity }) {
  const images = [
    { src: university.coverImage, alt: `${university.name} campus` },
    { src: university.logo, alt: `${university.name} logo` },
  ].filter((img) => img.src);

  return (
    <section aria-labelledby="campus-heading" className="space-y-6">
      <h2 id="campus-heading" className="sr-only">Campus Images</h2>
      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.map((img, index) => (
            <div
              key={index}
              className="rounded-xl overflow-hidden border border-gray-200 bg-white aspect-[16/9]"
            >
              <UniversityImage
                src={img.src}
                alt={img.alt}
                initials={university.name}
                className="w-full h-full object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
          <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Campus images not yet published
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Add campus photographs in the content management system to display
            them here.
          </p>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Location & contact                                                 */
/* ------------------------------------------------------------------ */

function LocationSection({ university }: { university: PublicUniversity }) {
  const hasContact =
    university.contactEmail || university.contactPhone || university.address;

  return (
    <section aria-labelledby="location-heading" className="space-y-6">
      <h2 id="location-heading" className="sr-only">Location & Contact</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            Location
          </h3>
          <dl className="space-y-3">
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
          </dl>
        </article>

        {hasContact && (
          <article className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Link className="h-5 w-5 text-primary-600" />
              Contact Information
            </h3>
            <dl className="space-y-3">
              {university.contactEmail && (
                <ContactRow label="Email">
                  <a
                    href={`mailto:${university.contactEmail}`}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    {university.contactEmail}
                  </a>
                </ContactRow>
              )}
              {university.contactPhone && (
                <ContactRow label="Phone">
                  <a
                    href={`tel:${university.contactPhone}`}
                    className="text-sm text-gray-900"
                  >
                    {university.contactPhone}
                  </a>
                </ContactRow>
              )}
            </dl>
          </article>
        )}
      </div>
    </section>
  );
}

function cityLine(university: PublicUniversity): string {
  return university.city ? university.city : "Location not stated";
}

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-20 text-sm font-medium text-gray-500">{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rankings                                                           */
/* ------------------------------------------------------------------ */

function RankingsSection({ university }: { university: PublicUniversity }) {
  return (
    <section aria-labelledby="rankings-heading" className="space-y-4">
      <h2 id="rankings-heading" className="sr-only">Rankings</h2>
      {(university.qsRanking || university.theRanking) ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary-600" />
            Verified Rankings
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {university.qsRanking && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RankingBadge ranking={university.qsRanking} source="qs" />
                </div>
                <p className="text-sm text-gray-600">
                  Position in the QS World University Rankings. Ranking data is
                  displayed only when verified and available from the ranking
                  organisation.
                </p>
              </div>
            )}
            {university.theRanking && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RankingBadge ranking={university.theRanking} source="the" />
                </div>
                <p className="text-sm text-gray-600">
                  Position in the Times Higher Education Rankings. Ranking data
                  is displayed only when verified and available.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
          No verified university rankings are published for this institution.
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Courses                                                            */
/* ------------------------------------------------------------------ */

function CoursesSection({ university }: { university: PublicUniversity }) {
  return (
    <section aria-labelledby="courses-heading" className="space-y-4">
      <h2 id="courses-heading" className="sr-only">Available Courses</h2>
      {university.popularFields.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-600" />
            Popular Courses &amp; Subject Areas
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Subject areas taught at {university.name}, based on published
            programme information.
          </p>
          <div className="flex flex-wrap gap-2">
            {university.popularFields.map((field) => (
              <span
                key={field}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <EmptySection
          message="No courses or subject areas are published for this university."
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Programmes by level                                                */
/* ------------------------------------------------------------------ */

function programmesFields(scholarships: PublicScholarship[]): string[] {
  const seen = new Set<string>();
  for (const s of scholarships) {
    for (const field of s.fields) seen.add(field);
  }
  return [...seen].sort();
}

function ProgrammesSection({
  scholarships,
  levelLabel,
  emptyMessage,
}: {
  scholarships: PublicScholarship[];
  levelLabel: string;
  emptyMessage: string;
}) {
  const fields = programmesFields(scholarships);
  return (
    <section className="space-y-4">
      {fields.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary-600" />
            {levelLabel}
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Programme areas with published scholarships at{" "}
            {levelLabel.toLowerCase()} level.
          </p>
          <div className="flex flex-wrap gap-2">
            {fields.map((field) => (
              <span
                key={field}
                className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-800"
              >
                {field}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            {scholarships.length} scholarship{scholarships.length === 1 ? "" : "s"} published at this level.
          </p>
        </div>
      ) : (
        <EmptySection message={emptyMessage} />
      )}
    </section>
  );
}

function UndergraduateSection({
  scholarships,
  university,
}: {
  scholarships: PublicScholarship[];
  university: PublicUniversity;
}) {
  return (
    <ProgrammesSection
      scholarships={scholarships}
      levelLabel="Undergraduate Programmes"
      emptyMessage={`No undergraduate programmes with published scholarships are listed for ${university.name}.`}
    />
  );
}

function PostgraduateSection({
  scholarships,
  university,
}: {
  scholarships: PublicScholarship[];
  university: PublicUniversity;
}) {
  return (
    <ProgrammesSection
      scholarships={scholarships}
      levelLabel="Postgraduate Programmes"
      emptyMessage={`No postgraduate programmes with published scholarships are listed for ${university.name}.`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Tuition                                                            */
/* ------------------------------------------------------------------ */

function TuitionSection({ university }: { university: PublicUniversity }) {
  return (
    <section aria-labelledby="tuition-heading" className="space-y-4">
      <h2 id="tuition-heading" className="sr-only">Tuition Fees</h2>
      {university.tuitionInfo ? (
        <article className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary-600" />
            Tuition &amp; Fees
          </h3>
          <div className="prose prose-sm prose-gray max-w-none text-gray-700">
            <p className="whitespace-pre-wrap">{university.tuitionInfo}</p>
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
              {formatCurrency(scholarship.fundingAmount, scholarship.currency)}
              {scholarship.monthlyStipend && (
                <>
                  <br />
                  <span className="text-gray-500 font-normal">
                    + {formatCurrency(scholarship.monthlyStipend, scholarship.currency)}/mo
                  </span>
                </>
              )}
            </>
          ) : scholarship.monthlyStipend ? (
            formatCurrency(scholarship.monthlyStipend, scholarship.currency) + "/mo"
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
/* Entry requirements                                                 */
/* ------------------------------------------------------------------ */

function EntrySection({ university }: { university: PublicUniversity }) {
  return (
    <section aria-labelledby="entry-heading" className="space-y-4">
      <h2 id="entry-heading" className="sr-only">Entry Requirements</h2>
      {university.admissionInfo ? (
        <article className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Check className="h-5 w-5 text-primary-600" />
            Entry Requirements
          </h3>
          <div className="prose prose-sm prose-gray max-w-none text-gray-700">
            <p className="whitespace-pre-wrap">{university.admissionInfo}</p>
          </div>
        </article>
      ) : (
        <EmptySection
          message="General entry requirements are not published for this university."
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
    <section aria-labelledby="intakes-heading" className="space-y-4">
      <h2 id="intakes-heading" className="sr-only">Available Intakes</h2>
      {intakes.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Available Intakes
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Intakes with published scholarships at {university.name}.
          </p>
          <div className="flex flex-wrap gap-2">
            {intakes.map((name) => (
              <span
                key={name}
                className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-800"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <EmptySection message="No published intakes are listed for this university." />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Deadlines                                                          */
/* ------------------------------------------------------------------ */

function DeadlinesSection({
  deadlines,
  university,
}: {
  deadlines: PublicScholarship[];
  university: PublicUniversity;
}) {
  return (
    <section aria-labelledby="deadlines-heading" className="space-y-4">
      <h2 id="deadlines-heading" className="sr-only">Application Deadlines</h2>
      {deadlines.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-600" />
            Upcoming Application Deadlines
          </h3>
          <div className="space-y-3">
            {deadlines.map((sch) => (
              <div
                key={sch.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {sch.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {scholarshipStudyLevels(sch).join(", ") || "All levels"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatDate(sch.deadline)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptySection
          message="No upcoming application deadlines are published for this university."
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Official website                                                   */
/* ------------------------------------------------------------------ */

function WebsiteSection({ university }: { university: PublicUniversity }) {
  return (
    <section aria-labelledby="website-heading" className="space-y-4">
      <h2 id="website-heading" className="sr-only">Official Website</h2>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-primary-600" />
          Official University Website
        </h3>
        <div className="space-y-3">
          {university.website && (
            <a
              href={university.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
            >
              <ExternalLink className="h-4 w-4" />
              Visit {university.name}
            </a>
          )}
          {university.admissionsWebsite && (
            <a
              href={university.admissionsWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
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
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptySection({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}
