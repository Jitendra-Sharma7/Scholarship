/**
 * Global Scholarship Hub - database seed.
 *
 * Imports the legacy in-memory dataset (src/lib/data/*.ts) into PostgreSQL so
 * the admin CMS and the public website share one source of truth.
 *
 * The script is fully idempotent: every record is upserted on its original
 * legacy id, so running it repeatedly updates rows instead of duplicating them.
 * Nothing is deleted, so admin edits are preserved on re-run except for the
 * columns the legacy dataset does not know about.
 *
 * Run with:  npm run db:seed
 */

import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { seedCountries } from "./seed-data/countries";
import { countryReference } from "./seed-data/country-reference";
import { seedFields } from "./seed-data/fields";
import { seedUniversities } from "./seed-data/universities";
import { seedProviders } from "./seed-data/providers";
import { seedScholarships } from "./seed-data/scholarships";
import { guides, posts, faqs } from "./seed-data/content";
import {
  toPrismaDeadlineStatus,
  toPrismaFundingType,
  toPrismaVerificationStatus,
} from "../src/lib/enums";

const prisma = new PrismaClient();

const LEGACY_SOURCE = "Imported from legacy site dataset";

/** Mirrors `slugify` in src/lib/slug.ts so seeded slugs match admin-created ones. */
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

/**
 * Guarantees slug uniqueness by appending -2, -3, ...
 *
 * `isTaken` reports whether a candidate slug is already used. Keeping the
 * lookup behind a callback avoids fighting Prisma's intersection-typed
 * where-unique inputs.
 */
async function uniqueSlug(
  isTaken: (slug: string) => Promise<boolean>,
  desired: string
): Promise<string> {
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

/** Renders legacy `{ heading, body[] }` sections into simple markdown. */
function sectionsToMarkdown(
  sections: { heading: string; body: string[] }[] | undefined
): string {
  if (!sections || sections.length === 0) return "";
  return sections
    .map((s) => `## ${s.heading}\n\n${(s.body ?? []).join("\n\n")}`)
    .join("\n\n");
}

async function persistCountries() {
  let n = 0;
  for (const c of seedCountries) {
    const slug = await uniqueSlug(
      async (s) => (await prisma.country.findUnique({ where: { slug: s } })) !== null,
      slugify(c.name)
    );
    await prisma.country.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        code: c.code,
        slug,
        region: c.region,
        description: c.description ?? null,
        // Legacy emoji flags are dropped on purpose: Windows cannot render
        // regional-indicator emoji, and the UI now uses /flags/{code}.png.
        flag: null,
        studyInfo: (c.languageRequirements ?? []).join("; ") || null,
        visaInfo: c.visaInfo ?? null,
        costOfLiving: c.avgLivingCost ?? null,
        popularUniversities: c.popularUniversities ?? [],
        featured: Boolean(c.featured),
        publishStatus: "PUBLISHED",
        seoDescription: c.description ?? null,
      },
      create: {
        id: c.id,
        name: c.name,
        code: c.code,
        slug,
        region: c.region,
        description: c.description ?? null,
        flag: null,
        studyInfo: (c.languageRequirements ?? []).join("; ") || null,
        visaInfo: c.visaInfo ?? null,
        costOfLiving: c.avgLivingCost ?? null,
        popularUniversities: c.popularUniversities ?? [],
        featured: Boolean(c.featured),
        publishStatus: "PUBLISHED",
        seoDescription: c.description ?? null,
        includeInSitemap: true,
      },
    });
    n += 1;
  }

  // The 20 editorial country records above carry the prose (description, costs,
  // visa notes, universities). The ISO reference list fills in the rest of the
  // world with objective facts only -- name, ISO codes, capital, continent,
  // currency -- so nothing below invents guidance that a real source has not
  // confirmed. Editorial fields are never overwritten here.
  const existingCodes = new Set(seedCountries.map((c) => c.code.toUpperCase()));
  let referenceOnly = 0;
  for (const ref of countryReference) {
    if (existingCodes.has(ref.code.toUpperCase())) continue;
    const id = ref.code.toLowerCase();
    const slug = await uniqueSlug(
      async (s) => (await prisma.country.findUnique({ where: { slug: s } })) !== null,
      slugify(ref.name)
    );
    await prisma.country.upsert({
      where: { id },
      update: {
        code3: ref.code3,
        capital: ref.capital,
        continent: ref.continent,
        currency: ref.currency,
      },
      create: {
        id,
        name: ref.name,
        code: ref.code,
        code3: ref.code3,
        slug,
        capital: ref.capital,
        continent: ref.continent,
        currency: ref.currency,
        region: ref.continent,
        flag: null,
        description: null,
        popularUniversities: [],
        publishStatus: "PUBLISHED",
        includeInSitemap: true,
      },
    });
    referenceOnly += 1;
  }

  console.log(`  countries: ${n} editorial + ${referenceOnly} ISO reference`);
  return n + referenceOnly;
}

async function persistFields() {
  let n = 0;
  for (const f of seedFields) {
    const slug = await uniqueSlug(
      async (s) => (await prisma.field.findUnique({ where: { slug: s } })) !== null,
      f.slug || slugify(f.name)
    );
    await prisma.field.upsert({
      where: { id: f.id },
      update: {
        name: f.name,
        slug,
        category: f.category ?? null,
        description: f.description ?? null,
        popularDegrees: f.popularDegrees ?? [],
        careerPaths: f.careerPaths ?? [],
        avgSalary: f.avgSalary ?? null,
        publishStatus: "PUBLISHED",
        seoDescription: f.description ?? null,
      },
      create: {
        id: f.id,
        name: f.name,
        slug,
        category: f.category ?? null,
        description: f.description ?? null,
        popularDegrees: f.popularDegrees ?? [],
        careerPaths: f.careerPaths ?? [],
        avgSalary: f.avgSalary ?? null,
        publishStatus: "PUBLISHED",
        seoDescription: f.description ?? null,
        includeInSitemap: true,
      },
    });
    n += 1;
  }
  console.log(`  fields: ${n}`);
  return n;
}

async function persistProviders() {
  let n = 0;
  for (const p of seedProviders) {
    await prisma.provider.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        type: p.type,
        country: p.country ?? null,
        website: p.website ?? null,
        description: p.description ?? null,
        verified: Boolean(p.verified),
        established: p.established ?? null,
        focusAreas: p.focusAreas ?? [],
      },
      create: {
        id: p.id,
        name: p.name,
        type: p.type,
        country: p.country ?? null,
        website: p.website ?? null,
        description: p.description ?? null,
        verified: Boolean(p.verified),
        established: p.established ?? null,
        focusAreas: p.focusAreas ?? [],
      },
    });
    n += 1;
  }
  console.log(`  providers: ${n}`);
  return n;
}

async function persistUniversities(countryByName: Map<string, string>) {
  let n = 0;
  let unresolved = 0;
  for (const u of seedUniversities) {
    const countryId = countryByName.get(u.country) ?? null;
    if (!countryId) unresolved += 1;
    const slug = await uniqueSlug(
      async (s) => (await prisma.university.findUnique({ where: { slug: s } })) !== null,
      slugify(u.name)
    );
    const data = {
      name: u.name,
      slug,
      countryId,
      // Retained only so a country added later still shows the original text.
      countryNameLegacy: u.country,
      city: u.city ?? null,
      description: u.description ?? null,
      // Legacy logo emoji are replaced by null: the UI no longer renders emoji.
      logo: null,
      website: u.website ?? null,
      admissionsWebsite: u.website ?? null,
      foundedYear: u.establishedYear ?? null,
      qsRanking: u.ranking ?? null,
      studentCount: u.studentCount ?? null,
      internationalStudentPercent: u.internationalStudentPercent ?? null,
      popularFields: u.programs ?? [],
      tuitionInfo: u.tuitionInfo ?? null,
      admissionInfo: u.admissionInfo ?? null,
      internationalInfo: u.internationalInfo ?? null,
      publishStatus: "PUBLISHED" as const,
      seoDescription: u.description ?? null,
      includeInSitemap: true,
    };
    await prisma.university.upsert({
      where: { id: u.id },
      update: data,
      create: { id: u.id, ...data },
    });
    n += 1;
  }
  console.log(`  universities: ${n}${unresolved ? ` (${unresolved} unmatched country)` : ""}`);
  return n;
}

async function persistScholarships(
  countryIds: Set<string>,
  universityIds: Set<string>,
  providerIds: Set<string>,
  fieldNamesById: Map<string, string>
) {
  let n = 0;
  for (const s of seedScholarships) {
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
      // The source data states a total award and an application fee; dropping
      // them here left every listing showing "not stated" in the comparison and
      // detail views.
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
      source: LEGACY_SOURCE,
      verificationStatus: toPrismaVerificationStatus(s.verificationStatus),
      publishStatus: "PUBLISHED" as const,
      // Preserved so the public site keeps its existing wording until the
      // deadline calculator runs on read.
      deadlineStatus: toPrismaDeadlineStatus(s.status),
      featured: Boolean(s.featured),
      includeInSitemap: true,
    };

    await prisma.scholarship.upsert({
      where: { id: s.id },
      update: data,
      create: { id: s.id, ...data },
    });

    // Rebuild join rows so re-running cannot accumulate stale links.
    await prisma.scholarshipField.deleteMany({ where: { scholarshipId: s.id } });
    if (matchedFieldIds.length) {
      await prisma.scholarshipField.createMany({
        data: matchedFieldIds.map((fieldId) => ({ scholarshipId: s.id, fieldId })),
        skipDuplicates: true,
      });
    }
    await prisma.scholarshipCountry.deleteMany({ where: { scholarshipId: s.id } });
    if (countryId) {
      await prisma.scholarshipCountry.create({
        data: { scholarshipId: s.id, countryId },
      });
    }
    n += 1;
  }
  console.log(`  scholarships: ${n}`);
  return n;
}

async function seedEditorial() {
  // Legacy posts and guides are keyed by slug, not by a stable id. Resolve the
  // existing row by that key FIRST and update it, rather than asking
  // `uniqueSlug` for a free slug - asking for a free slug on a re-run would
  // invent "slug-2" and duplicate every post.
  const desiredSlug = (raw: string) => slugify(raw);

  let blog = 0;
  for (const p of posts) {
    const content = sectionsToMarkdown(p.sections);
    const publishedAt = toDate(p.published);
    const data = {
      title: p.title,
      excerpt: p.excerpt ?? null,
      content,
      authorName: p.author ?? null,
      category: p.category ?? null,
      readingTime: p.readMinutes ?? null,
      publishedAt,
      publishStatus: "PUBLISHED" as const,
      seoDescription: p.excerpt ?? null,
    };

    const existing = await prisma.blogPost.findUnique({ where: { slug: desiredSlug(p.slug) } });
    if (existing) {
      await prisma.blogPost.update({ where: { id: existing.id }, data });
    } else {
      // Only allocate a fresh slug when the legacy key is genuinely absent.
      const slug = await uniqueSlug(
        async (s) => (await prisma.blogPost.findUnique({ where: { slug: s } })) !== null,
        desiredSlug(p.slug)
      );
      await prisma.blogPost.create({ data: { ...data, slug, includeInSitemap: true } });
    }
    blog += 1;
  }

  let guide = 0;
  for (const g of guides) {
    const data = {
      title: g.title,
      category: g.category,
      excerpt: g.excerpt ?? null,
      content: sectionsToMarkdown(g.sections),
      published: true,
    };

    const existing = await prisma.guide.findUnique({ where: { slug: desiredSlug(g.slug) } });
    if (existing) {
      await prisma.guide.update({ where: { id: existing.id }, data });
    } else {
      const slug = await uniqueSlug(
        async (s) => (await prisma.guide.findUnique({ where: { slug: s } })) !== null,
        desiredSlug(g.slug)
      );
      await prisma.guide.create({ data: { ...data, slug } });
    }
    guide += 1;

    // The same guide is also written as a published Resource row. `/resources`
    // reads the Resource table, which is what the admin Resources section
    // edits, so seeding only the Guide table would leave staff edits invisible
    // on the public site. The public reader de-duplicates by slug, so the Guide
    // row above never shows up twice.
    const resourceSlug = desiredSlug(g.slug);
    const resourceData = {
      title: g.title,
      category: g.category,
      description: g.excerpt ?? null,
      content: data.content,
      type: "GUIDE" as const,
      publishStatus: "PUBLISHED" as const,
      includeInSitemap: true,
    };
    const existingResource = await prisma.resource.findUnique({
      where: { slug: resourceSlug },
    });
    if (existingResource) {
      await prisma.resource.update({ where: { id: existingResource.id }, data: resourceData });
    } else {
      await prisma.resource.create({ data: { ...resourceData, slug: resourceSlug } });
    }
  }

  // FAQs are matched on question text so re-running does not duplicate them.
  let faq = 0;
  const existingFaqs = await prisma.fAQ.findMany({ select: { id: true, question: true } });
  const byQuestion = new Map(existingFaqs.map((f) => [f.question, f.id]));
  for (const f of faqs) {
    const data = {
      question: f.question,
      answer: f.answer,
      category: f.category ?? null,
      publishStatus: "PUBLISHED" as const,
    };
    const existingId = byQuestion.get(f.question);
    if (existingId) {
      await prisma.fAQ.update({ where: { id: existingId }, data });
    } else {
      await prisma.fAQ.create({ data });
    }
    faq += 1;
  }

  console.log(`  blog posts: ${blog}, guides: ${guide}, faqs: ${faq}`);
  return blog + guide + faq;
}

async function seedSettings() {
  const defaults: { key: string; value: Prisma.InputJsonValue; group: string; label: string }[] = [
    { key: "site.name", value: "Global Scholarship Hub", group: "general", label: "Website name" },
    {
      key: "site.description",
      value:
        "Discover, filter, compare, save, and apply for scholarships, grants, fellowships, and financial-aid opportunities from around the world.",
      group: "general",
      label: "Website description",
    },
    { key: "site.contactEmail", value: "jitendra.route2uni@gmail.com", group: "general", label: "Contact email" },
    { key: "site.supportEmail", value: "support@globalscholarshiphub.com", group: "general", label: "Support email" },
    { key: "seo.defaultTitle", value: "Global Scholarship Hub", group: "seo", label: "Default SEO title" },
    {
      key: "seo.defaultDescription",
      value: "Find verified scholarships, grants and fellowships from around the world.",
      group: "seo",
      label: "Default SEO description",
    },
    { key: "seo.robotsIndex", value: true, group: "seo", label: "Allow search engine indexing" },
    { key: "seo.sitemapEnabled", value: true, group: "seo", label: "Include in sitemap" },
    // Drives the automatic "Closing Soon" badge.
    { key: "scholarships.closingSoonDays", value: 14, group: "scholarships", label: "Closing-soon threshold (days)" },
    { key: "scholarships.pageSize", value: 12, group: "scholarships", label: "Default page size" },
    { key: "scholarships.autoStatus", value: true, group: "scholarships", label: "Calculate status automatically" },
  ];

  for (const s of defaults) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {}, // never overwrite admin edits
      create: { key: s.key, value: s.value, group: s.group, label: s.label },
    });
  }
  console.log(`  settings: ${defaults.length}`);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "  admin: skipped (set ADMIN_EMAIL and ADMIN_PASSWORD, then re-run to create the first admin)"
    );
    return null;
  }

  const role = (process.env.ADMIN_ROLE?.toUpperCase() || "SUPER_ADMIN") as
    | "SUPER_ADMIN"
    | "ADMIN"
    | "EDITOR";

  // Hash before the lookup so a re-run also repairs a changed password.
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role, password: hashed, suspended: false, lastLoginAt: null },
    create: {
      email,
      name: process.env.ADMIN_NAME || "Site Administrator",
      password: hashed,
      role,
      emailVerified: new Date(),
    },
  });

  console.log(`  admin: ${user.email} (${user.role})`);
  return user;
}

async function main() {
  console.log("Seeding Global Scholarship Hub...");

  await persistCountries();
  await persistFields();
  await persistProviders();

  // Build lookup maps from the database so seeding only links real rows.
  const countries = await prisma.country.findMany({ select: { id: true, name: true } });
  const countryIds = new Set(countries.map((c) => c.id));
  const countryByName = new Map(countries.map((c) => [c.name, c.id]));

  const universities = await prisma.university.findMany({ select: { id: true } });
  const universityIds = new Set(universities.map((u) => u.id));

  const providers = await prisma.provider.findMany({ select: { id: true } });
  const providerIds = new Set(providers.map((p) => p.id));

  const fields = await prisma.field.findMany({ select: { id: true, name: true } });
  const fieldNamesById = new Map(fields.map((f) => [f.id, f.name]));

  await persistUniversities(countryByName);
  await persistScholarships(countryIds, universityIds, providerIds, fieldNamesById);
  await seedEditorial();
  await seedSettings();
  await seedAdmin();

  const counts = {
    scholarships: await prisma.scholarship.count(),
    universities: await prisma.university.count(),
    countries: await prisma.country.count(),
    fields: await prisma.field.count(),
    providers: await prisma.provider.count(),
    blogPosts: await prisma.blogPost.count(),
    guides: await prisma.guide.count(),
    resources: await prisma.resource.count(),
    faqs: await prisma.fAQ.count(),
    users: await prisma.user.count(),
  };

  console.log("\nDatabase now contains:");
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k.padEnd(14)} ${v}`);
  }
  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
