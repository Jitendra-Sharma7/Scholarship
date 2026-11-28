import { prisma } from "@/lib/prisma";
import {
  slugify,
  type CourseSearchOptions,
  type DegreeOption,
  type SubjectOption,
  type CountryOption,
  type RegionOption,
  type StudyModeOption,
  type DurationOption,
  type TuitionFeeOption,
  type CourseTypeOption,
} from "@/lib/course-search";
import type { Paginated } from "@/lib/data/public";

/**
 * Course data source.
 *
 * Courses are stored in their own `Course` table and are completely separate
 * from scholarships. Nothing in this module reads or falls back to the
 * `Scholarship` model: if there are no course rows for a category, the caller
 * gets an empty result and the UI shows "No courses available".
 *
 * The navbar categories are a fixed, canonical set (the three degree levels,
 * six subjects, and the Europe/Germany country entries). They are always
 * present in the filter options so a click such as `?degree=masters` always
 * resolves to a real, labelled filter chip even when no course matches yet.
 * Any additional degree/subject a course introduces is merged in on top.
 */

const VISIBLE = { publishStatus: "PUBLISHED" as const, deletedAt: null };

/** The exact degree categories the navbar exposes. */
const CANONICAL_DEGREES: DegreeOption[] = [
  { value: "Undergraduate", slug: "undergraduate", label: "Undergraduate" },
  { value: "Master's", slug: "masters", label: "Master's" },
  { value: "MBA", slug: "mba", label: "MBA" },
];

/** The exact subject categories the navbar exposes. */
const CANONICAL_SUBJECTS = [
  "Business",
  "Computer Science",
  "Data Science",
  "Design",
  "Finance",
  "Marketing",
];

/** Regions the navbar exposes as countries-by-region entries. */
const CANONICAL_REGIONS = ["Europe"];

export interface PublicCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  degree: string;
  subject: string;
  studyMode: string | null;
  duration: string | null;
  tuitionAmount: number | null;
  currency: string | null;
  courseType: string | null;
  intake: string | null;
  language: string | null;
  url: string | null;
  coverImage: string | null;
  logo: string | null;
  featured: boolean;
  universityName: string | null;
  countryName: string | null;
  countryCode: string | null;
  createdAt: string;
}

export interface CourseQuery {
  degree?: string;
  /** Subject name (resolved from the ?subject= slug). */
  subject?: string;
  /** A single Country id. */
  country?: string;
  /** A Country.region (e.g. "Europe"); resolved to the region's country ids. */
  region?: string;
  university?: string;
  studyMode?: string;
  duration?: string;
  /** JSON range `{ min, max }` matched against tuitionAmount. */
  tuitionFee?: string;
  courseType?: string;
  page?: number;
  limit?: number;
}

const courseInclude = {
  country: { select: { id: true, name: true, code: true } },
  university: { select: { id: true, name: true } },
} as const;

type CourseRow = Awaited<
  ReturnType<typeof prisma.course.findFirstOrThrow<{ include: typeof courseInclude }>>
>;

function toPublicCourse(row: CourseRow): PublicCourse {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    shortDescription: row.shortDescription,
    degree: row.degree,
    subject: row.subject,
    studyMode: row.studyMode,
    duration: row.duration,
    tuitionAmount: row.tuitionAmount,
    currency: row.currency,
    courseType: row.courseType,
    intake: row.intake,
    language: row.language,
    url: row.url,
    coverImage: row.coverImage,
    logo: row.logo,
    featured: row.featured,
    universityName: row.university?.name ?? null,
    countryName: row.country?.name ?? null,
    countryCode: row.country?.code ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Dynamic filter options for the unified Course Search page, built from the
 * `Course` table plus the canonical navbar categories.
 */
export async function getCourseSearchOptions(): Promise<CourseSearchOptions> {
  const [
    degreeRows,
    subjectRows,
    countryRows,
    universityRows,
    studyModeRows,
    durationRows,
    courseTypeRows,
  ] = await Promise.all([
    prisma.course.findMany({
      where: VISIBLE,
      select: { degree: true },
      distinct: ["degree"],
    }),
    prisma.course.findMany({
      where: VISIBLE,
      select: { subject: true },
      distinct: ["subject"],
    }),
    prisma.country.findMany({
      where: VISIBLE,
      select: { id: true, name: true, code: true, slug: true, region: true },
      orderBy: { name: "asc" },
    }),
    prisma.course.findMany({
      where: VISIBLE,
      select: { university: { select: { id: true, name: true } } },
      distinct: ["universityId"],
    }),
    prisma.course.findMany({
      where: { ...VISIBLE, studyMode: { not: null } },
      select: { studyMode: true },
      distinct: ["studyMode"],
    }),
    prisma.course.findMany({
      where: { ...VISIBLE, duration: { not: null } },
      select: { duration: true },
      distinct: ["duration"],
    }),
    prisma.course.findMany({
      where: { ...VISIBLE, courseType: { not: null } },
      select: { courseType: true },
      distinct: ["courseType"],
    }),
  ]);

  // --- Degrees: canonical three first, then any extra from course data. ---
  const degreeBySlug = new Map<string, DegreeOption>();
  for (const d of CANONICAL_DEGREES) degreeBySlug.set(d.slug, d);
  for (const row of degreeRows) {
    const trimmed = row.degree.trim();
    if (!trimmed) continue;
    const slug = slugify(trimmed);
    if (!degreeBySlug.has(slug)) {
      degreeBySlug.set(slug, { value: trimmed, slug, label: trimmed });
    }
  }
  const degrees = [...degreeBySlug.values()];

  // --- Subjects: canonical six first, then any extra from course data. ---
  const subjectBySlug = new Map<string, SubjectOption>();
  for (const name of CANONICAL_SUBJECTS) {
    const slug = slugify(name);
    subjectBySlug.set(slug, { id: slug, slug, name });
  }
  for (const row of subjectRows) {
    const trimmed = row.subject.trim();
    if (!trimmed) continue;
    const slug = slugify(trimmed);
    if (!subjectBySlug.has(slug)) {
      subjectBySlug.set(slug, { id: slug, slug, name: trimmed });
    }
  }
  const subjects = [...subjectBySlug.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // --- Countries + regions. ---
  const countries: CountryOption[] = countryRows
    .map((c) => ({
      id: c.id,
      slug: c.slug || slugify(c.name),
      name: c.name,
      code: c.code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const regionBySlug = new Map<string, RegionOption>();
  for (const name of CANONICAL_REGIONS) {
    regionBySlug.set(slugify(name), { name, slug: slugify(name) });
  }
  for (const c of countryRows) {
    const region = c.region?.trim();
    if (!region) continue;
    const slug = slugify(region);
    if (!regionBySlug.has(slug)) regionBySlug.set(slug, { name: region, slug });
  }
  const regions = [...regionBySlug.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // --- Universities that actually have a course. ---
  const universities = universityRows
    .map((u) => u.university)
    .filter((u): u is { id: string; name: string } => Boolean(u))
    .sort((a, b) => a.name.localeCompare(b.name));

  // --- Study Modes ---
  const studyModeBySlug = new Map<string, StudyModeOption>();
  for (const row of studyModeRows) {
    const value = row.studyMode?.trim();
    if (!value) continue;
    const slug = slugify(value);
    if (!studyModeBySlug.has(slug)) {
      studyModeBySlug.set(slug, { value, slug, label: value });
    }
  }
  const studyModes = [...studyModeBySlug.values()].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  // --- Durations ---
  const durationBySlug = new Map<string, DurationOption>();
  for (const row of durationRows) {
    const value = row.duration?.trim();
    if (!value) continue;
    const slug = slugify(value);
    if (!durationBySlug.has(slug)) {
      durationBySlug.set(slug, { value, slug, label: value });
    }
  }
  const durations = [...durationBySlug.values()].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  // --- Tuition Fee Ranges (generic bands matched against tuitionAmount). ---
  const tuitionFeeBySlug = new Map<string, TuitionFeeOption>();
  const tuitionRanges = [
    { min: 0, max: 5000, label: "Under €5,000" },
    { min: 5000, max: 10000, label: "€5,000 - €10,000" },
    { min: 10000, max: 20000, label: "€10,000 - €20,000" },
    { min: 20000, max: 50000, label: "€20,000 - €50,000" },
    { min: 50000, max: Infinity, label: "Over €50,000" },
  ];
  for (const range of tuitionRanges) {
    const slug = slugify(range.label);
    tuitionFeeBySlug.set(slug, {
      value: JSON.stringify(range),
      slug,
      label: range.label,
    });
  }
  const tuitionFees = [...tuitionFeeBySlug.values()];

  // --- Course Types ---
  const courseTypeBySlug = new Map<string, CourseTypeOption>();
  for (const row of courseTypeRows) {
    const value = row.courseType?.trim();
    if (!value) continue;
    const slug = slugify(value);
    if (!courseTypeBySlug.has(slug)) {
      courseTypeBySlug.set(slug, { value, slug, label: value });
    }
  }
  const courseTypes = [...courseTypeBySlug.values()].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return {
    degrees,
    subjects,
    countries,
    regions,
    universities,
    studyModes,
    durations,
    tuitionFees,
    courseTypes,
  };
}

/**
 * Read one page of published courses matching the resolved filters. Only the
 * `Course` table is queried; an unmatched filter yields an empty page rather
 * than any scholarship data.
 */
export async function getPublicCourses(
  opts: CourseQuery = {},
): Promise<Paginated<PublicCourse>> {
  const {
    degree,
    subject,
    country,
    region,
    university,
    studyMode,
    duration,
    tuitionFee,
    courseType,
    page = 1,
    limit = 12,
  } = opts;

  const where: Record<string, unknown> = { ...VISIBLE };

  if (degree) where.degree = { equals: degree, mode: "insensitive" };
  if (subject) where.subject = { equals: subject, mode: "insensitive" };
  if (university) where.universityId = university;

  // A region resolves to its member country ids in one round trip; an unknown
  // region yields an empty set rather than "no filter".
  if (region && !country) {
    const regionCountries = await prisma.country.findMany({
      where: { ...VISIBLE, region: { equals: region, mode: "insensitive" } },
      select: { id: true },
    });
    const regionIds = regionCountries.map((c) => c.id);
    where.countryId = regionIds.length > 0 ? { in: regionIds } : { in: [] };
  }
  if (country) where.countryId = country;

  if (studyMode) where.studyMode = { equals: studyMode, mode: "insensitive" };
  if (duration) where.duration = { contains: duration, mode: "insensitive" };
  if (courseType) {
    where.courseType = { equals: courseType, mode: "insensitive" };
  }

  if (tuitionFee) {
    try {
      const range = JSON.parse(tuitionFee) as { min?: number; max?: number };
      const amountFilter: Record<string, number> = {};
      if (typeof range.min === "number") amountFilter.gte = range.min;
      if (typeof range.max === "number" && range.max !== Infinity) {
        amountFilter.lte = range.max;
      }
      if (Object.keys(amountFilter).length > 0) {
        where.tuitionAmount = amountFilter;
      }
    } catch {
      // Invalid tuitionFee format, ignore.
    }
  }

  const [rows, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: courseInclude,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip: (Math.max(1, page) - 1) * limit,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    data: rows.map(toPublicCourse),
    total,
    page: Math.max(1, page),
    totalPages,
    hasMore: page < totalPages,
  };
}