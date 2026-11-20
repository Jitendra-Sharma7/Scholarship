import { prisma } from "@/lib/prisma";

export interface IntakeData {
  id: string;
  name: string;
  slug: string;
  startMonth: number;
  startYear: number;
  endMonth?: number | null;
  endYear?: number | null;
  isActive: boolean;
  sortOrder: number;
  description?: string | null;
  scholarshipCount?: number;
  createdAt?: Date | string;
}

export async function getIntakes(includeInactive = false) {
  return prisma.intake.findMany({
    where: includeInactive ? {} : { isActive: true, deletedAt: null },
    orderBy: [{ startYear: "desc" }, { startMonth: "desc" }, { sortOrder: "asc" }],
    include: {
      _count: { select: { scholarships: true } },
    },
  });
}

export async function getIntakeBySlug(slug: string) {
  return prisma.intake.findUnique({
    where: { slug },
    include: {
      scholarships: {
        include: {
          scholarship: {
            include: {
              country: { select: { name: true, code: true } },
              university: { select: { name: true, slug: true } },
              fields: { include: { field: { select: { name: true, slug: true } } } },
            },
          },
        },
      },
    },
  });
}

export async function getIntakeWithScholarships(
  slug: string,
  filters: {
    country?: string;
    field?: string;
    degree?: string;
    funding?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const intake = await prisma.intake.findUnique({
    where: { slug },
  });

  if (!intake) return null;

  const { page = 1, limit = 12, country, field, degree, funding } = filters;

  const where: any = {
    scholarship: {
      publishStatus: "PUBLISHED",
      deletedAt: null,
    },
    intakeId: intake.id,
  };

  if (country) where.scholarship.countryId = country;
  if (field) where.scholarship.fields = { some: { fieldId: field } };
  if (degree) where.scholarship.degreeLevels = { has: degree };
  if (funding) where.scholarship.fundingType = funding.toUpperCase().replace(/-/g, "_");

  const [scholarships, total] = await Promise.all([
    prisma.scholarshipIntake.findMany({
      where,
      include: {
        scholarship: {
          include: {
            country: { select: { name: true, code: true } },
            university: { select: { name: true, slug: true } },
            fields: { include: { field: { select: { name: true, slug: true } } } },
          },
        },
      },
      orderBy: { scholarship: { deadline: "asc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.scholarshipIntake.count({ where }),
  ]);

  return {
    intake,
    scholarships: scholarships.map(s => s.scholarship),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createIntake(data: {
  name: string;
  startMonth: number;
  startYear: number;
  endMonth?: number;
  endYear?: number;
  description?: string;
}) {
  const slug = data.name.toLowerCase().replace(/\s+/g, "-");
  
  // Ensure unique slug
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.intake.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter++}`;
  }

  const maxSortOrder = await prisma.intake.aggregate({
    _max: { sortOrder: true },
  });

  return prisma.intake.create({
    data: {
      name: data.name,
      slug: uniqueSlug,
      startMonth: data.startMonth,
      startYear: data.startYear,
      endMonth: data.endMonth,
      endYear: data.endYear,
      description: data.description,
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
    },
  });
}

export async function updateIntake(id: string, data: Partial<IntakeData>) {
  return prisma.intake.update({
    where: { id },
    data,
  });
}

export async function deleteIntake(id: string) {
  return prisma.intake.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

export async function linkScholarshipToIntake(
  scholarshipId: string,
  intakeId: string,
  options: { deadline?: Date; openingDate?: Date; isPrimary?: boolean } = {}
) {
  return prisma.scholarshipIntake.upsert({
    where: { scholarshipId_intakeId: { scholarshipId, intakeId } },
    create: { scholarshipId, intakeId, ...options },
    update: { ...options },
  });
}

export async function unlinkScholarshipFromIntake(scholarshipId: string, intakeId: string) {
  return prisma.scholarshipIntake.delete({
    where: { scholarshipId_intakeId: { scholarshipId, intakeId } },
  });
}

export async function getScholarshipIntakes(scholarshipId: string) {
  return prisma.scholarshipIntake.findMany({
    where: { scholarshipId },
    include: { intake: true },
    orderBy: { intake: { startYear: "desc" } },
  });
}

export async function seedDefaultIntakes() {
  const defaultIntakes = [
    { name: "September 2027", startMonth: 9, startYear: 2027, sortOrder: 1 },
    { name: "January 2028", startMonth: 1, startYear: 2028, sortOrder: 2 },
    { name: "May 2028", startMonth: 5, startYear: 2028, sortOrder: 3 },
    { name: "September 2028", startMonth: 9, startYear: 2028, sortOrder: 4 },
    { name: "January 2029", startMonth: 1, startYear: 2029, sortOrder: 5 },
  ];

  for (const intake of defaultIntakes) {
    const slug = intake.name.toLowerCase().replace(/\s+/g, "-");
    await prisma.intake.upsert({
      where: { slug },
      update: {},
      create: { ...intake, slug },
    });
  }
}