import { prisma } from "@/lib/prisma";
import { getPublicFields, getPublicUniversitiesList } from "@/lib/data/public";
import {
  slugify,
  type CourseSearchOptions,
  type DegreeOption,
  type SubjectOption,
  type CountryOption,
  type RegionOption,
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

  const [degreeRows, fields, countryRows, universities] = await Promise.all([
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

  return {
    degrees,
    subjects,
    countries,
    regions,
    universities: universities.map((u) => ({ id: u.id, name: u.name })),
  };
}