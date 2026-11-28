import { prisma } from "@/lib/prisma";
import { getPublicFields } from "@/lib/data/public";
import { slugify } from "@/lib/course-search";

const VISIBLE = { publishStatus: "PUBLISHED" as const, deletedAt: null };

export interface CourseNavItem {
  label: string;
  href: string;
}

export interface CourseNavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  links: CourseNavItem[];
}

export async function getCourseNavGroups(): Promise<CourseNavGroup[]> {
  const [degreeRows, fields, countryRows] = await Promise.all([
    prisma.scholarship.findMany({
      where: VISIBLE,
      select: { degreeLevels: true },
    }),
    getPublicFields(),
    prisma.country.findMany({
      where: VISIBLE,
      select: { id: true, name: true, code: true, slug: true, region: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const degreeBySlug = new Map<string, { value: string; slug: string; label: string }>();
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
  const degrees = [...degreeBySlug.values()].sort((a, b) => a.label.localeCompare(b.label));

  const subjects = fields
    .filter((f) => f.scholarshipCount > 0)
    .map((f) => ({ name: f.name, slug: f.slug || slugify(f.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const regionBySlug = new Map<string, { name: string; slug: string }>();
  for (const c of countryRows) {
    const region = c.region?.trim();
    if (!region) continue;
    const slug = slugify(region);
    if (!regionBySlug.has(slug)) regionBySlug.set(slug, { name: region, slug });
  }
  const regions = [...regionBySlug.values()].sort((a, b) => a.name.localeCompare(b.name));

  const countries = countryRows
    .map((c) => ({ name: c.name, slug: c.slug || slugify(c.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [
    {
      id: "degree",
      label: "Courses by Degree",
      icon: () => null,
      links: [
        ...degrees.map((d) => ({
          label: `${d.label} Courses`,
          href: `/course-search?degree=${d.slug}`,
        })),
        { label: "View All Courses", href: "/course-search" },
      ],
    },
    {
      id: "subject",
      label: "Courses by Subject",
      icon: () => null,
      links: [
        ...subjects.map((s) => ({
          label: `${s.name} Courses`,
          href: `/course-search?subject=${s.slug}`,
        })),
        { label: "View All Courses", href: "/course-search" },
      ],
    },
    {
      id: "country",
      label: "Courses by Country",
      icon: () => null,
      links: [
        ...regions.map((r) => ({
          label: `${r.name} Courses`,
          href: `/course-search?country=${r.slug}`,
        })),
        ...countries.map((c) => ({
          label: `${c.name} Courses`,
          href: `/course-search?country=${c.slug}`,
        })),
        { label: "View All Courses", href: "/course-search" },
      ],
    },
  ];
}

export async function getCourseNavGroupsServer(): Promise<Omit<CourseNavGroup, "icon">[]> {
  const groups = await getCourseNavGroups();
  return groups.map((g) => ({
    id: g.id,
    label: g.label,
    links: g.links,
  }));
}