import { DeadlineStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  fromPrismaFundingType,
  fromPrismaStudyMode,
  fromPrismaVerificationStatus,
} from "@/lib/enums";
import {
  evaluateDeadlineSync,
  DEFAULT_PUBLIC_STATUSES,
} from "@/lib/deadline";
import type { DeadlineStatusValue } from "@/lib/enums";

/**
 * Public read model.
 *
 * Every public page reads through this module, so the admin CMS and the
 * website are always looking at the same rows. The shapes returned here match
 * the interfaces the existing components already consume, so no public markup
 * had to change - only where its data comes from.
 *
 * Only `publishStatus = PUBLISHED` and non-deleted rows are exposed; drafts,
 * archived records and anything in the trash are invisible to the public.
 */

export interface PublicScholarship {
  id: string;
  title: string;
  providerId: string | null;
  universityId: string | null;
  countryId: string | null;
  description: string | null;
  shortDescription: string | null;
  degreeLevels: string[];
  fields: string[];
  eligibleCountries: string[];
  fundingType: string;
  fundingAmount: number | null;
  currency: string | null;
  tuitionCoverage: boolean;
  accommodationCoverage: boolean;
  livingStipend: number | null;
  travelAllowance: boolean;
  healthInsurance: boolean;
  visaSupport: boolean;
  applicationFee: number | null;
  deadline: string;
  openingDate?: string;
  duration: string | null;
  numAwards: number | null;
  minGpa: number | null;
  languageReqs: string[];
  documentsRequired: string[];
  applicationUrl: string | null;
  officialUrl: string | null;
  verificationStatus: string;
  lastVerifiedAt: string | null;
  status: DeadlineStatusValue;
  featured?: boolean;
  // Extras the existing cards already read.
  /** The canonical URL segment: detail pages are published under the slug. */
  slug: string;
  isFullyFunded: boolean;
  studyMode: string | null;
  city: string | null;
  universityName: string | null;
  providerName: string | null;
  countryName: string | null;
  /** ISO 3166-1 alpha-2, used to render /flags/{code}.png. */
  countryCode: string | null;
  logo: string | null;
  coverImage: string | null;
  documentsCount: number;
  applicationProcess: string[];
  selectionCriteria: string[];
  academicReqs: string[];
  otherRequirements: string | null;
  workExpReq: string | null;
  ieltsReq: number | null;
  toeflReq: number | null;
  ageRequirement: number | null;
  intake: string | null;
  otherBenefits: string | null;
  annualStipend: number | null;
  monthlyStipend: number | null;
  researchFunding: boolean;
  subField: string | null;
  studyType: string | null;
  deadlineType: string | null;
  applicationMethod: string | null;
  providerContact: string | null;
  source: string;
  seoTitle: string | null;
  seoDescription: string | null;
  /**
   * Editor override for the canonical URL. `null` means "use the slug", which
   * is the correct default. Only honoured when it is a valid absolute URL -
   * see `src/lib/seo.ts`.
   */
  canonicalUrl: string | null;
  /** Editor flag to keep a record out of search results. */
  noindex: boolean;
  numAwardsValue: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicCountry {
  id: string;
  name: string;
  code: string;
  region: string;
  /** Legacy emoji field: always null now that flags render as images. */
  flag: string | null;
  scholarshipCount: number;
  featured: boolean;
  description: string | null;
  popularUniversities: string[];
  avgLivingCost: string | null;
  languageRequirements: string[];
  visaInfo: string | null;
  slug: string;
  capital: string | null;
  continent: string | null;
  currency: string | null;
  universityCount: number;
  costOfLiving: string | null;
  studyInfo: string | null;
  popularFields: string[];
}

/**
 * The country fields a picker needs: an option in a `<select>`, a searchable
 * list, a flag.
 *
 * A `PublicCountry` also carries the editorial copy - description, study info,
 * visa notes, living costs, popular fields. That is worth having on a country
 * page, but passing the full record into a client component ships all of it to
 * the browser: 197 countries were serialised into the RSC payload of the
 * homepage, /finder, /scholarships and /countries, and the pickers rendered four
 * fields out of twenty.
 */
export interface PublicCountryOption {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2, used to render /flags/{code}.svg. */
  code: string;
  /** Shown beside the name in searchable lists. */
  capital: string | null;
}

/** What a country card renders. Narrower than the record, for the same reason. */
export interface PublicCountryCard {
  id: string;
  name: string;
  code: string;
  region: string;
  capital: string | null;
  scholarshipCount: number;
  description: string | null;
  currency: string | null;
  popularUniversities: string[];
}

export function toCountryOption(c: PublicCountry): PublicCountryOption {
  return { id: c.id, name: c.name, code: c.code, capital: c.capital };
}

export function toCountryCard(c: PublicCountry): PublicCountryCard {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    region: c.region,
    capital: c.capital,
    scholarshipCount: c.scholarshipCount,
    description: c.description,
    currency: c.currency,
    popularUniversities: c.popularUniversities,
  };
}

export interface PublicField {  id: string;
  name: string;
  slug: string;
  category: string | null;
  scholarshipCount: number;
  description: string | null;
  popularDegrees: string[];
  careerPaths: string[];
  avgSalary: string | null;
  parentId: string | null;
  children: { id: string; name: string; slug: string }[];
}

export interface PublicUniversity {
  id: string;
  name: string;
  country: string;
  city: string | null;
  website: string | null;
  logo: string | null;
  /** Higher is better; unranked institutions sort last. */
  ranking: number;
  description: string | null;
  programs: string[];
  tuitionInfo: string | null;
  admissionInfo: string | null;
  internationalInfo: string | null;
  scholarshipCount: number;
  establishedYear: number | null;
  studentCount: number | null;
  internationalStudentPercent: number | null;
  countryId: string | null;
  slug: string;
  coverImage: string | null;
  type: string | null;
  ownership: string | null;
  qsRanking: number | null;
  theRanking: number | null;
  acceptanceRate: number | null;
  internationalStudentCount: number | null;
  address: string | null;
  contactEmail: string | null;
  featured: boolean;
}

export interface PublicProvider {
  id: string;
  name: string;
  type: string;
  country: string | null;
  website: string | null;
  description: string | null;
  verified: boolean;
  scholarshipCount: number;
  established: number | null;
  focusAreas: string[];
}

const iso = (d: Date | null | undefined): string | null =>
  d ? d.toISOString() : null;

/** Shared include so a scholarship always arrives with its relations resolved. */
const scholarshipInclude = {
  country: { select: { id: true, name: true, code: true } },
  university: { select: { id: true, name: true, slug: true, city: true } },
  provider: { select: { id: true, name: true } },
  fields: { include: { field: { select: { id: true, name: true, slug: true } } } },
} as const;

type ScholarshipRow = Awaited<
  ReturnType<typeof prisma.scholarship.findFirstOrThrow<{ include: typeof scholarshipInclude }>>
>;

export function toPublicScholarship(
  row: ScholarshipRow,
  closingSoonDays = 14,
  now = new Date()
): PublicScholarship {
  const { status } = evaluateDeadlineSync({
    deadline: row.deadline,
    openingDate: row.openingDate,
    override: row.deadlineStatusOverride,
    closingSoonDays,
    now,
  });

  // Linked Field names come first, then any free-text legacy labels, de-duped
  // so the same label never renders twice.
  const linkedNames = row.fields.map((link) => link.field.name);
  const fields = [...new Set([...linkedNames, ...row.fieldLabels])];

  return {
    id: row.id,
    title: row.title,
    providerId: row.providerId,
    universityId: row.universityId,
    countryId: row.countryId,
    description: row.description,
    shortDescription: row.shortDescription,
    degreeLevels: row.degreeLevels,
    fields,
    eligibleCountries: row.eligibleCountries,
    fundingType: fromPrismaFundingType(row.fundingType),
    fundingAmount: row.fundingAmount,
    currency: row.currency,
    tuitionCoverage: row.tuitionCoverage,
    accommodationCoverage: row.accommodationCoverage,
    livingStipend: row.monthlyStipend,
    travelAllowance: row.travelAllowance,
    healthInsurance: row.healthInsurance,
    visaSupport: row.visaSupport,
    applicationFee: row.applicationFee,
    // The public contract is a string; an undated record reports an empty value
    // and is filtered out by the default status filter.
    deadline: iso(row.deadline) ?? "",
    openingDate: iso(row.openingDate) ?? undefined,
    duration: row.duration,
    numAwards: row.numAwards,
    minGpa: row.minGpa,
    languageReqs: row.languageReqs,
    documentsRequired: row.documentsRequired,
    applicationUrl: row.applicationUrl,
    officialUrl: row.officialUrl,
    verificationStatus: fromPrismaVerificationStatus(row.verificationStatus),
    lastVerifiedAt: iso(row.lastVerifiedAt),
    status,
    featured: row.featured,
    slug: row.slug,
    isFullyFunded: row.isFullyFunded,
    studyMode: fromPrismaStudyMode(row.studyMode),
    city: row.city,
    universityName: row.university?.name ?? row.universityNameLegacy ?? null,
    providerName: row.provider?.name ?? null,
    countryName: row.country?.name ?? row.countryNameLegacy ?? null,
    countryCode: row.country?.code ?? null,
    logo: row.logo,
    coverImage: row.coverImage,
    documentsCount: row.documentsRequired.length,
    applicationProcess: row.applicationProcess,
    selectionCriteria: row.selectionCriteria,
    academicReqs: row.academicReqs,
    otherRequirements: row.otherRequirements,
    workExpReq: row.workExpReq,
    ieltsReq: row.ieltsReq,
    toeflReq: row.toeflReq,
    ageRequirement: row.ageRequirement,
    intake: row.intake,
    otherBenefits: row.otherBenefits,
    annualStipend: row.annualStipend,
    monthlyStipend: row.monthlyStipend,
    researchFunding: row.researchFunding,
    subField: row.subField,
    studyType: row.studyType,
    deadlineType: row.deadlineType,
    applicationMethod: row.applicationMethod,
    providerContact: row.providerContact,
    source: row.source,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    // Editors can set these in the CMS but nothing read them until now, so
    // `noindex: true` had no effect and a custom canonical was ignored.
    canonicalUrl: row.canonicalUrl,
    noindex: row.noindex,
    numAwardsValue: row.numAwards,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const VISIBLE = { publishStatus: "PUBLISHED" as const, deletedAt: null };

// --- Countries ------------------------------------------------------------

export async function getPublicCountries(): Promise<PublicCountry[]> {
  const rows = await prisma.country.findMany({
    where: VISIBLE,
    orderBy: { name: "asc" },
    include: { _count: { select: { scholarships: true, universities: true } } },
  });

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    region: c.region,
    flag: null,
    // Counts are derived, so they cannot drift from the real data.
    scholarshipCount: c._count.scholarships,
    featured: c.featured,
    description: c.description,
    popularUniversities: c.popularUniversities,
    avgLivingCost: c.costOfLiving,
    languageRequirements: c.studyInfo ? c.studyInfo.split("; ").filter(Boolean) : [],
    visaInfo: c.visaInfo,
    slug: c.slug,
    capital: c.capital,
    continent: c.continent,
    currency: c.currency,
    universityCount: c._count.universities,
    costOfLiving: c.costOfLiving,
    studyInfo: c.studyInfo,
    popularFields: c.popularFields,
  }));
}

// --- Fields ---------------------------------------------------------------

export async function getPublicFields(): Promise<PublicField[]> {
  const rows = await prisma.field.findMany({
    where: { publishStatus: "PUBLISHED", deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { scholarships: true } },
      children: { where: { deletedAt: null }, select: { id: true, name: true, slug: true } },
    },
  });

  return rows.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    category: f.category,
    scholarshipCount: f._count.scholarships,
    description: f.description,
    popularDegrees: f.popularDegrees,
    careerPaths: f.careerPaths,
    avgSalary: f.avgSalary,
    parentId: f.parentId,
    children: f.children,
  }));
}

// --- Universities ---------------------------------------------------------

export async function getPublicUniversities(limit?: number): Promise<PublicUniversity[]> {
  const rows = await prisma.university.findMany({
    where: VISIBLE,
    orderBy: [{ qsRanking: "asc" }, { name: "asc" }],
    take: limit,
    include: {
      country: { select: { id: true, name: true } },
      _count: { select: { scholarships: true } },
    },
  });

  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    country: u.country?.name ?? u.countryNameLegacy ?? "",
    city: u.city,
    website: u.website,
    logo: u.logo,
    // Unranked institutions sort after every ranked one.
    ranking: u.qsRanking ?? 9999,
    description: u.description,
    programs: u.popularFields,
    tuitionInfo: u.tuitionInfo,
    admissionInfo: u.admissionInfo,
    internationalInfo: u.internationalInfo,
    scholarshipCount: u._count.scholarships,
    establishedYear: u.foundedYear,
    studentCount: u.studentCount,
    internationalStudentPercent: u.internationalStudentPercent,
    countryId: u.countryId,
    slug: u.slug,
    coverImage: u.coverImage,
    type: u.type,
    ownership: u.ownership,
    qsRanking: u.qsRanking,
    theRanking: u.theRanking,
    acceptanceRate: u.acceptanceRate,
    internationalStudentCount: u.internationalStudentCount,
    address: u.address,
    contactEmail: u.contactEmail,
    featured: u.featured,
  }));
}

// --- Providers ------------------------------------------------------------

export async function getPublicProviders(): Promise<PublicProvider[]> {
  const rows = await prisma.provider.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { scholarships: true } } },
  });

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    country: p.country,
    website: p.website,
    description: p.description,
    verified: p.verified,
    scholarshipCount: p._count.scholarships,
    established: p.established,
    focusAreas: p.focusAreas,
  }));
}

// --- Scholarships ---------------------------------------------------------

export interface ScholarshipQuery {
  query?: string;
  country?: string;
  field?: string;
  degree?: string;
  funding?: string;
  status?: string;
  fullyFunded?: boolean;
  featured?: boolean;
  university?: string;
  page?: number;
  limit?: number;
  /** Internal: the Top Opportunities section. */
  featuredOnly?: boolean;
  sort?: "deadline" | "newest" | "title" | "featured";
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export async function getPublicScholarships(
  opts: ScholarshipQuery = {},
  closingSoonDays = 14
): Promise<Paginated<PublicScholarship>> {
  const {
    query,
    country,
    field,
    degree,
    funding,
    status,
    fullyFunded,
    featured,
    university,
    page = 1,
    limit = 12,
    featuredOnly = false,
    sort = "deadline",
  } = opts;

  const where: Record<string, unknown> = { ...VISIBLE };
  const now = new Date();

  if (query) {
    // Escaped so a user cannot inject LIKE wildcards.
    const like = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    where.OR = [
      { title: { contains: like, mode: "insensitive" } },
      { description: { contains: like, mode: "insensitive" } },
    ];
  }
  if (country) where.countryId = country;
  if (university) where.universityId = university;
  if (fullyFunded) where.isFullyFunded = true;
  if (featured) where.featured = true;
  if (featuredOnly) where.featured = true;
  if (funding) where.fundingType = funding.toUpperCase().replace(/-/g, "_");
  if (degree) where.degreeLevels = { has: degree };
  if (field && field !== "all") where.fields = { some: { fieldId: field } };

  // Status is derived from the deadline, so it is filtered in SQL rather than
  // in memory. Filtering after pagination would let a page of already-expired
  // rows render empty while the total said otherwise.
  //
  // `deadlineStatusOverride` only ever holds a listing open past its nominal
  // date, so the override is expressed as an alternative to the date test
  // rather than as a separate branch.
  const HOLD_OPEN = { in: ["OPEN", "OPENING_SOON", "CLOSING_SOON"] };

  if (status) {
    const wanted = status.trim().toLowerCase();
    if (wanted === "expired" || wanted === "closed") {
      // Expired = the deadline has passed and nothing is holding it open.
      where.AND = [
        { OR: [{ deadline: null }, { deadline: { lt: now } }] },
        { deadlineStatusOverride: null },
      ];
    } else if (wanted === "open") {
      where.AND = [
        { deadline: { gt: now } },
        { OR: [{ openingDate: null }, { openingDate: { lte: now } }] },
      ];
    } else if (wanted === "closing soon") {
      const cutoff = new Date(now.getTime() + closingSoonDays * 24 * 60 * 60 * 1000);
      where.AND = [{ deadline: { gt: now, lte: cutoff } }];
    } else if (wanted === "opening soon") {
      where.AND = [{ openingDate: { gt: now } }];
    } else if (wanted === "upcoming") {
      where.AND = [{ deadline: { gt: now } }];
    }
  } else if (!featuredOnly) {
    // Default: everything a visitor can still act on, plus anything an admin
    // has explicitly held open.
    where.OR = [
      {
        AND: [
          { deadline: { gt: now } },
          { OR: [{ openingDate: null }, { openingDate: { lte: now } }] },
        ],
      },
      { deadlineStatusOverride: HOLD_OPEN },
    ];
  }

  const orderBy =
    sort === "newest"
      ? { createdAt: "desc" as const }
      : sort === "title"
        ? { title: "asc" as const }
        : sort === "featured"
          ? [{ featuredOrder: "asc" as const }, { createdAt: "desc" as const }]
          : { deadline: "asc" as const };

  const [rows, total] = await Promise.all([
    prisma.scholarship.findMany({
      where,
      orderBy,
      include: scholarshipInclude,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.scholarship.count({ where }),
  ]);

  const data = rows.map((r) => toPublicScholarship(r, closingSoonDays, now));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { data, total, page, totalPages, hasMore: page < totalPages };
}

export async function getPublicScholarshipById(
  id: string,
  closingSoonDays = 14
): Promise<PublicScholarship | null> {
  const row = await prisma.scholarship.findFirst({
    where: { ...VISIBLE, OR: [{ id }, { slug: id }] },
    include: scholarshipInclude,
  });
  return row ? toPublicScholarship(row, closingSoonDays) : null;
}

// --- Content: blog, resources, FAQs ---------------------------------------

export interface ContentSection {
  heading: string;
  body: string[];
}

export interface PublicPost {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  author: string | null;
  published: string;
  readMinutes: number | null;
  featuredImage: string | null;
  sections: ContentSection[];
  tags: string[];
}

export interface PublicResource {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  type: string;
  url: string | null;
  fileUrl: string | null;
  thumbnail: string | null;
  readMinutes: number | null;
  updated: string;
  sections: ContentSection[];
  tags: string[];
}

export interface PublicFaq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

/**
 * Splits stored markdown back into the `{ heading, body[] }` shape the public
 * pages render. The seed writes the same format (`## Heading` then paragraphs),
 * and an editor typing in the admin textarea produces the same thing, so a post
 * written either way renders with its headings intact. Text with no `##`
 * heading becomes a single untitled section rather than disappearing.
 */
function markdownToSections(markdown: string): ContentSection[] {
  const text = (markdown ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const blocks = text.split(/\n(?=##\s)/);
  const sections: ContentSection[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    const first = lines[0] ?? "";
    const isHeading = first.startsWith("## ");
    const heading = isHeading ? first.slice(3).trim() : "";
    const body = (isHeading ? lines.slice(1) : lines)
      .join("\n")
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (heading || body.length > 0) sections.push({ heading, body });
  }

  return sections;
}

function estimateReadMinutes(sections: ContentSection[], words: number): number {
  const fromText = Math.ceil(words / 220);
  return Math.max(1, fromText);
}

export async function getPublicPosts(): Promise<PublicPost[]> {
  const rows = await prisma.blogPost.findMany({
    where: { ...VISIBLE, publishedAt: { not: null, lte: new Date() } },
    orderBy: { publishedAt: "desc" },
  });

  return rows.map((p) => {
    const sections = markdownToSections(p.content);
    const words = sections.reduce(
      (n, s) => n + s.body.join(" ").split(/\s+/).filter(Boolean).length,
      0
    );
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      excerpt: p.excerpt,
      author: p.authorName,
      published: (p.publishedAt ?? p.createdAt).toISOString(),
      readMinutes: p.readingTime ?? estimateReadMinutes(sections, words),
      featuredImage: p.featuredImage,
      sections,
      tags: p.tags,
    };
  });
}

export async function getPublicPostBySlug(slug: string): Promise<PublicPost | null> {
  const posts = await getPublicPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getPublicResources(): Promise<PublicResource[]> {
  // Resources are the admin's `Resource` rows. The `Guide` table holds the same
  // editorial content from an earlier schema, so it is merged in rather than
  // left as an unreachable second copy of the same guides.
  const [resources, guides] = await Promise.all([
    prisma.resource.findMany({
      where: VISIBLE,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.guide.findMany({
      where: { published: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const fromResources: PublicResource[] = resources.map((r) => {
    const sections = markdownToSections(r.content ?? "");
    const words = sections.reduce(
      (n, s) => n + s.body.join(" ").split(/\s+/).filter(Boolean).length,
      0
    );
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category,
      excerpt: r.description,
      type: r.type,
      url: r.url,
      fileUrl: r.fileUrl,
      thumbnail: r.thumbnail,
      readMinutes: estimateReadMinutes(sections, words),
      updated: r.updatedAt.toISOString(),
      sections,
      tags: r.tags,
    };
  });

  const resourceSlugs = new Set(fromResources.map((r) => r.slug));
  const fromGuides: PublicResource[] = guides
    .filter((g) => !resourceSlugs.has(g.slug))
    .map((g) => {
      const sections = markdownToSections(g.content);
      const words = sections.reduce(
        (n, s) => n + s.body.join(" ").split(/\s+/).filter(Boolean).length,
        0
      );
      return {
        id: g.id,
        slug: g.slug,
        title: g.title,
        category: g.category,
        excerpt: g.excerpt,
        type: "GUIDE",
        url: null,
        fileUrl: null,
        thumbnail: null,
        readMinutes: estimateReadMinutes(sections, words),
        updated: g.updatedAt.toISOString(),
        sections,
        tags: [],
      };
    });

  return [...fromResources, ...fromGuides].sort((a, b) => b.updated.localeCompare(a.updated));
}

export async function getPublicResourceBySlug(slug: string): Promise<PublicResource | null> {
  const resources = await getPublicResources();
  return resources.find((r) => r.slug === slug) ?? null;
}

export async function getPublicFaqs(): Promise<PublicFaq[]> {
  const rows = await prisma.fAQ.findMany({
    where: VISIBLE,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
  }));
}

export interface PublicStats {
  /** Published listings a visitor can still act on. */
  openScholarships: number;
  /** Published, non-deleted countries. */
  countries: number;
  universities: number;
  fields: number;
  /**
   * How many open listings state a funding amount. The amounts span several
   * currencies, so they are counted rather than summed: adding USD to EUR
   * would produce a number that means nothing.
   */
  listingsWithFunding: number;
  /** Share of open listings an editor has verified recently, 0-100. */
  verifiedShare: number;
}

/**
 * Headline figures for the marketing strip.
 *
 * Every number is counted from the published records. The previous hard-coded
 * "1,200+ scholarships / 85+ destinations / $45M+ funding" strip claimed far
 * more than the database held, which is exactly the fabrication this project
 * exists to avoid.
 */
export async function getPublicStats(now = new Date()): Promise<PublicStats> {
  const visible: Prisma.ScholarshipWhereInput = { ...VISIBLE };
  // Same default window the listing uses: a deadline that has passed, with no
  // admin override holding it open, is not something a visitor can apply to.
  const openWhere: Prisma.ScholarshipWhereInput = {
    AND: [
      visible,
      {
        OR: [
          {
            AND: [
              { deadline: { gt: now } },
              { OR: [{ openingDate: null }, { openingDate: { lte: now } }] },
            ],
          },
          {
            deadlineStatusOverride: {
              in: [
                DeadlineStatus.OPEN,
                DeadlineStatus.OPENING_SOON,
                DeadlineStatus.CLOSING_SOON,
              ],
            },
          },
        ],
      },
    ],
  };

  const [openScholarships, countries, universities, fields, withFunding, verified] =
    await Promise.all([
      prisma.scholarship.count({ where: openWhere }),
      prisma.country.count({ where: VISIBLE }),
      prisma.university.count({ where: VISIBLE }),
      prisma.field.count({ where: VISIBLE }),
      prisma.scholarship.count({ where: { ...openWhere, fundingAmount: { not: null } } }),
      prisma.scholarship.count({ where: { ...openWhere, verificationStatus: "VERIFIED_RECENTLY" } }),
    ]);

  return {
    openScholarships,
    countries,
    universities,
    fields,
    listingsWithFunding: withFunding,
    verifiedShare: openScholarships > 0 ? Math.round((verified / openScholarships) * 100) : 0,
  };
}

export { DEFAULT_PUBLIC_STATUSES };
export type { DeadlineStatusValue };
