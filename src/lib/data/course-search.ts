import { prisma } from "@/lib/prisma";
import { getPublicFields, getPublicUniversitiesList } from "@/lib/data/public";
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

/**
 * Dynamic filter options for the unified Course Search page.
 *
 * Nothing here is a hardcoded category list: degrees come from the distinct
 * `degreeLevels` actually present on published scholarships, subjects from the
 * published Fields, and countries/regions from the Country table. A category
 * with no visible courses therefore never appears, and adding a new degree,
 * field or country in the admin surfaces here automatically.
 */
export async function getCourseSearchOptions(): Promise<CourseSearchOptions> {
  const VISIBLE = { publishStatus: "PUBLISHED" as const, deletedAt: null };

  const [
    degreeRows,
    fields,
    countryRows,
    universities,
    studyModeRows,
    durationRows,
    courseTypeRows,
  ] = await Promise.all([
    // Distinct degree levels across every published, non-deleted scholarship.
    prisma.scholarship.findMany({
      where: VISIBLE,
      select: { degreeLevels: true },
    }),
    getPublicFields(),
    // Every visible country, with its region. A country with no matching course
    // simply yields an empty result set (handled by the empty state) rather than
    // disappearing from the filter, so a valid ?country=germany always resolves.
    prisma.country.findMany({
      where: VISIBLE,
      select: { id: true, name: true, code: true, slug: true, region: true },
      orderBy: { name: "asc" },
    }),
    getPublicUniversitiesList({ limit: 60 }),
    // Distinct study modes
    prisma.scholarship.findMany({
      where: { ...VISIBLE, studyMode: { not: null } },
      select: { studyMode: true },
    }),
    // Distinct durations
    prisma.scholarship.findMany({
      where: { ...VISIBLE, duration: { not: null } },
      select: { duration: true },
    }),
    // Distinct course types (using studyType)
    prisma.scholarship.findMany({
      where: { ...VISIBLE, studyType: { not: null } },
      select: { studyType: true },
    }),
  ]);

  // --- Degrees: distinct, de-duplicated by slug, with a friendly label. ---
  const degreeBySlug = new Map<string, DegreeOption>();
  for (const row of degreeRows) {
    for (const value of row.degreeLevels) {
      const trimmed = value.trim();
      if (!trimmed) continue;
      const slug = slugify(trimmed);
      if (!degreeBySlug.has(slug)) {
        degreeBySlug.set(slug, { value: trimmed, slug, label: trimmed });
      }
    }
  }
  const degrees = [...degreeBySlug.values()].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  // --- Subjects: only fields that have at least one visible scholarship. ---
  const subjects: SubjectOption[] = fields
    .filter((f) => f.scholarshipCount > 0)
    .map((f) => ({ id: f.id, slug: f.slug || slugify(f.name), name: f.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

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
  for (const c of countryRows) {
    const region = c.region?.trim();
    if (!region) continue;
    const slug = slugify(region);
    if (!regionBySlug.has(slug)) regionBySlug.set(slug, { name: region, slug });
  }
  const regions = [...regionBySlug.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

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

  // --- Tuition Fee Ranges ---
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
    tuitionFeeBySlug.set(slug, { value: JSON.stringify(range), slug, label: range.label });
  }
  const tuitionFees = [...tuitionFeeBySlug.values()];

  // --- Course Types ---
  const courseTypeBySlug = new Map<string, CourseTypeOption>();
  for (const row of courseTypeRows) {
    const value = row.studyType?.trim();
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
    universities: universities.map((u) => ({ id: u.id, name: u.name })),
    studyModes,
    durations,
    tuitionFees,
    courseTypes,
  };
}