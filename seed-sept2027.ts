import { PrismaClient } from "@prisma/client";
import { sept2027Scholarships } from "./prisma/seed-data/sept2027-scholarships";
import { toPrismaFundingType, toPrismaVerificationStatus, toPrismaDeadlineStatus } from "./src/lib/enums";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(isTaken: (slug: string) => Promise<boolean>, desired: string): Promise<string> {
  const base = desired || "untitled";
  let candidate = base;
  for (let n = 2; n < 500; n += 1) {
    if (!(await isTaken(candidate))) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

function toDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
  console.log("Seeding September 2027 scholarships and intakes...");

  // Build lookup maps
  const countries = await prisma.country.findMany({ select: { id: true, name: true } });
  const countryIds = new Set(countries.map((c) => c.id));
  const countryByName = new Map(countries.map((c) => [c.name, c.id]));

  const universities = await prisma.university.findMany({ select: { id: true } });
  const universityIds = new Set(universities.map((u) => u.id));

  const providers = await prisma.provider.findMany({ select: { id: true } });
  const providerIds = new Set(providers.map((p) => p.id));

  const fields = await prisma.field.findMany({ select: { id: true, name: true } });
  const fieldNamesById = new Map(fields.map((f) => [f.id, f.name]));

  // Ensure September 2027 intake exists
  const sept2027Intake = await prisma.intake.upsert({
    where: { slug: "september-2027" },
    update: {},
    create: {
      name: "September 2027",
      slug: "september-2027",
      startMonth: 9,
      startYear: 2027,
      sortOrder: 1,
      isActive: true,
    },
  });
  console.log("Created/updated intake:", sept2027Intake.name);

  // Also create other default intakes
  const defaultIntakes = [
    { name: "January 2028", slug: "january-2028", startMonth: 1, startYear: 2028, sortOrder: 2 },
    { name: "May 2028", slug: "may-2028", startMonth: 5, startYear: 2028, sortOrder: 3 },
    { name: "September 2028", slug: "september-2028", startMonth: 9, startYear: 2028, sortOrder: 4 },
    { name: "January 2029", slug: "january-2029", startMonth: 1, startYear: 2029, sortOrder: 5 },
  ];

  for (const intake of defaultIntakes) {
    await prisma.intake.upsert({
      where: { slug: intake.slug },
      update: {},
      create: { ...intake, isActive: true },
    });
    console.log("Created/updated intake:", intake.name);
  }

  let n = 0;
  for (const s of sept2027Scholarships) {
    const countryId = countryIds.has(s.countryId) ? s.countryId : null;
    const universityId = s.universityId && universityIds.has(s.universityId) ? s.universityId : null;
    const providerId = providerIds.has(s.providerId) ? s.providerId : null;

    // Split legacy field labels into real Field relations vs free text.
    const labels = s.fields ?? [];
    const matchedFieldIds: string[] = [];
    const extraLabels: string[] = [];
    for (const label of labels) {
      const found = [...fieldNamesById.entries()].find(([, name]) => name === label);
      if (found) matchedFieldIds.push(found[0]);
      else extraLabels.push(label);
    }

    const slug = await uniqueSlug(
      async (s) => (await prisma.scholarship.findUnique({ where: { slug: s } })) !== null,
      slugify(s.title)
    );

    const data = {
      title: s.title,
      slug,
      shortDescription: s.description ? s.description.slice(0, 200) : null,
      description: s.description ?? null,
      providerId,
      universityId,
      countryId,
      fundingType: toPrismaFundingType(s.fundingType),
      isFullyFunded: s.fundingType === "fully-funded",
      currency: s.currency ?? null,
      fundingAmount: s.fundingAmount ?? null,
      monthlyStipend: s.livingStipend ?? null,
      applicationFee: s.applicationFee ?? null,
      tuitionCoverage: Boolean(s.tuitionCoverage),
      accommodationCoverage: Boolean(s.accommodationCoverage),
      travelAllowance: Boolean(s.travelAllowance),
      healthInsurance: Boolean(s.healthInsurance),
      visaSupport: Boolean(s.visaSupport),
      degreeLevels: s.degreeLevels ?? [],
      fieldLabels: extraLabels,
      eligibleCountries: s.eligibleCountries ?? [],
      minGpa: s.minGpa ?? null,
      openingDate: toDate(s.openingDate),
      deadline: toDate(s.deadline),
      duration: s.duration ?? null,
      numAwards: s.numAwards ?? null,
      languageReqs: s.languageReqs ?? [],
      documentsRequired: s.documentsRequired ?? [],
      applicationUrl: s.applicationUrl ?? null,
      officialUrl: s.officialUrl ?? null,
      lastVerifiedAt: toDate(s.lastVerifiedAt),
      source: "Global Scholarship Point (globalscholarshippoint.com)",
      verificationStatus: toPrismaVerificationStatus(s.verificationStatus),
      publishStatus: "PUBLISHED" as const,
      deadlineStatus: toPrismaDeadlineStatus(s.status),
      featured: Boolean(s.featured),
      includeInSitemap: true,
      intake: s.intake ?? "September 2027",
    };

    const created = await prisma.scholarship.upsert({
      where: { id: s.id },
      update: data,
      create: { id: s.id, ...data },
    });

    // Link scholarship to the September 2027 intake
    await prisma.scholarshipIntake.upsert({
      where: { scholarshipId_intakeId: { scholarshipId: created.id, intakeId: sept2027Intake.id } },
      create: {
        scholarshipId: created.id,
        intakeId: sept2027Intake.id,
        deadline: toDate(s.deadline),
        openingDate: toDate(s.openingDate),
        isPrimary: true,
      },
      update: {
        deadline: toDate(s.deadline),
        openingDate: toDate(s.openingDate),
        isPrimary: true,
      },
    });

    // Rebuild field join rows
    await prisma.scholarshipField.deleteMany({ where: { scholarshipId: s.id } });
    if (matchedFieldIds.length) {
      await prisma.scholarshipField.createMany({
        data: matchedFieldIds.map((fieldId) => ({ scholarshipId: s.id, fieldId })),
        skipDuplicates: true,
      });
    }
    // Rebuild country join rows
    await prisma.scholarshipCountry.deleteMany({ where: { scholarshipId: s.id } });
    if (countryId) {
      await prisma.scholarshipCountry.create({
        data: { scholarshipId: s.id, countryId },
      });
    }
    n += 1;
  }
  console.log(`Seeded ${n} September 2027 scholarships`);

  // Final counts
  const totalScholarships = await prisma.scholarship.count();
  const totalIntakes = await prisma.intake.count();
  console.log(`Total scholarships: ${totalScholarships}`);
  console.log(`Total intakes: ${totalIntakes}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });