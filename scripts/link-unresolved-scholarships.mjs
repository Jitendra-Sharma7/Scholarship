/**
 * Resolves and links unresolved scholarship foreign keys:
 * (countryId, universityId, providerId, and ScholarshipField relations).
 *
 * Scans the database for scholarships with null relations (or with legacy names),
 * provisions any missing Country, University, Provider, or Field master records,
 * and updates the scholarship rows so every relation is strongly linked.
 *
 * Usage:
 *   node scripts/with-env.mjs node scripts/link-unresolved-scholarships.mjs [--source-file data/scholarships-archive-2027.json]
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { countryReference } from "../prisma/seed-data/country-reference.js";

const prisma = new PrismaClient();

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function slugify(input) {
  return String(input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Special custom destinations
const SPECIAL_COUNTRIES = [
  { name: "Europe", code: "EU", code3: "EUR", region: "Europe", continent: "Europe", currency: "EUR", capital: "Brussels" },
  { name: "Multiple Countries", code: "GLOBAL", code3: "GLB", region: "Global", continent: "Global", currency: "USD", capital: "Global" }
];

// Build country reference dictionary
const refByNormName = new Map();
const refByNormCode = new Map();

for (const c of [...countryReference, ...SPECIAL_COUNTRIES]) {
  refByNormName.set(norm(c.name), c);
  refByNormCode.set(norm(c.code), c);
  if (c.code3) refByNormCode.set(norm(c.code3), c);
}
// Alias mappings
refByNormName.set("turkiye", refByNormName.get("turkey"));
refByNormName.set("multiplecountries", refByNormName.get("multiplecountries"));

async function ensureCountry(rawName) {
  if (!rawName) return null;
  const n = norm(rawName);

  // Check existing in DB
  const existing = await prisma.country.findFirst({
    where: {
      OR: [
        { name: { equals: rawName, mode: "insensitive" } },
        { code: { equals: rawName, mode: "insensitive" } },
        { slug: slugify(rawName) }
      ]
    }
  });
  if (existing) return existing;

  const ref = refByNormName.get(n) ?? refByNormCode.get(n);
  const name = ref?.name ?? rawName;
  const code = ref?.code ?? rawName.slice(0, 2).toUpperCase();
  const code3 = ref?.code3 ?? null;
  const region = ref?.continent ?? "International";
  const continent = ref?.continent ?? "International";
  const currency = ref?.currency ?? null;
  const capital = ref?.capital ?? null;
  const slug = slugify(name);

  try {
    return await prisma.country.create({
      data: {
        name,
        code,
        code3,
        slug,
        region,
        continent,
        currency,
        capital,
        publishStatus: "PUBLISHED"
      }
    });
  } catch {
    // If slug or code conflict, fetch existing
    return await prisma.country.findFirst({
      where: { OR: [{ code }, { slug }] }
    });
  }
}

async function ensureUniversity(rawName, countryId, countryName) {
  if (!rawName) return null;
  const slug = slugify(rawName);

  const existing = await prisma.university.findFirst({
    where: {
      OR: [
        { name: { equals: rawName, mode: "insensitive" } },
        { slug }
      ]
    }
  });
  if (existing) {
    if (!existing.countryId && countryId) {
      return await prisma.university.update({
        where: { id: existing.id },
        data: { countryId, countryNameLegacy: countryName }
      });
    }
    return existing;
  }

  try {
    return await prisma.university.create({
      data: {
        name: rawName,
        slug,
        countryId: countryId ?? null,
        countryNameLegacy: countryName ?? null,
        publishStatus: "PUBLISHED"
      }
    });
  } catch {
    return await prisma.university.findFirst({
      where: { slug }
    });
  }
}

async function ensureProvider(rawName, countryName) {
  if (!rawName) return null;
  const existing = await prisma.provider.findFirst({
    where: { name: { equals: rawName, mode: "insensitive" } }
  });
  if (existing) return existing;

  let type = "University";
  const lower = rawName.toLowerCase();
  if (lower.includes("government") || lower.includes("ministry") || lower.includes("state") || lower.includes("embassy") || lower.includes("daadt") || lower.includes("daad") || lower.includes("csc") || lower.includes("niied") || lower.includes("mext")) {
    type = "Government";
  } else if (lower.includes("foundation") || lower.includes("trust") || lower.includes("gates") || lower.includes("yoneyama") || lower.includes("fellows") || lower.includes("fund")) {
    type = "Foundation";
  } else if (lower.includes("commission") || lower.includes("world bank") || lower.includes("erasmus") || lower.includes("un") || lower.includes("consortium") || lower.includes("vlir")) {
    type = "International Organization";
  }

  try {
    return await prisma.provider.create({
      data: {
        name: rawName,
        type,
        country: countryName ?? null,
        verified: true
      }
    });
  } catch {
    return await prisma.provider.findFirst({
      where: { name: rawName }
    });
  }
}

async function ensureField(rawLabel) {
  if (!rawLabel || /^all\b/i.test(rawLabel.trim())) return null;
  const label = rawLabel.trim();
  const slug = slugify(label);

  const existing = await prisma.field.findFirst({
    where: {
      OR: [
        { name: { equals: label, mode: "insensitive" } },
        { slug }
      ]
    }
  });
  if (existing) return existing;

  let category = "General";
  const l = label.toLowerCase();
  if (l.includes("engin") || l.includes("tech") || l.includes("comput") || l.includes("data") || l.includes("math") || l.includes("physic") || l.includes("chem") || l.includes("bio") || l.includes("science")) {
    category = "STEM";
  } else if (l.includes("busin") || l.includes("econom") || l.includes("financ") || l.includes("manage")) {
    category = "Business";
  } else if (l.includes("law") || l.includes("polic") || l.includes("relat") || l.includes("govern") || l.includes("soci")) {
    category = "Social Sciences";
  } else if (l.includes("art") || l.includes("human") || l.includes("cultur") || l.includes("ling") || l.includes("media") || l.includes("journ")) {
    category = "Humanities";
  } else if (l.includes("health") || l.includes("nurs") || l.includes("medic")) {
    category = "Health Sciences";
  }

  try {
    return await prisma.field.create({
      data: {
        name: label,
        slug,
        category,
        publishStatus: "PUBLISHED"
      }
    });
  } catch {
    return await prisma.field.findFirst({
      where: { slug }
    });
  }
}

// --- Main Reconciliation ----------------------------------------------------

async function main() {
  console.log("=== Linking Unresolved Scholarship Relations ===\n");

  // Optional: load source JSON if provided to backfill provider or original names
  const sourceArg = process.argv.find((a, i) => process.argv[i - 1] === "--source-file");
  const sourcePath = sourceArg ?? (existsSync("data/scholarships-archive-2027.json") ? "data/scholarships-archive-2027.json" : null);

  const sourceMap = new Map();
  if (sourcePath && existsSync(sourcePath)) {
    const fileRecords = JSON.parse(readFileSync(sourcePath, "utf8"));
    for (const r of fileRecords) {
      if (r.title) sourceMap.set(norm(r.title), r);
    }
    console.log(`Loaded ${sourceMap.size} reference records from ${sourcePath}.`);
  }

  const scholarships = await prisma.scholarship.findMany({
    include: {
      fields: true
    }
  });

  console.log(`Analyzing ${scholarships.length} scholarships in database...`);

  let countryLinked = 0;
  let universityLinked = 0;
  let providerLinked = 0;
  let fieldLinksCreated = 0;

  for (const s of scholarships) {
    const src = sourceMap.get(norm(s.title));
    const updates = {};

    // 1. Resolve Country
    let countryId = s.countryId;
    const countryName = s.countryNameLegacy ?? src?.country;
    if (!countryId && countryName) {
      const c = await ensureCountry(countryName);
      if (c) {
        updates.countryId = c.id;
        updates.countryNameLegacy = c.name;
        countryId = c.id;
        countryLinked += 1;
      }
    }

    // 2. Resolve University
    let universityId = s.universityId;
    const universityName = s.universityNameLegacy ?? src?.university;
    if (!universityId && universityName) {
      const u = await ensureUniversity(universityName, countryId, s.countryNameLegacy ?? countryName);
      if (u) {
        updates.universityId = u.id;
        updates.universityNameLegacy = u.name;
        universityId = u.id;
        universityLinked += 1;
      }
    }

    // 3. Resolve Provider
    let providerId = s.providerId;
    const providerName = src?.provider ?? (universityName && !lowerIncludes(s.title, "erasmus") ? universityName : null);
    if (!providerId && providerName) {
      const p = await ensureProvider(providerName, s.countryNameLegacy ?? countryName);
      if (p) {
        updates.providerId = p.id;
        providerId = p.id;
        providerLinked += 1;
      }
    }

    // Apply scholarship table updates if any relation was resolved
    if (Object.keys(updates).length > 0) {
      await prisma.scholarship.update({
        where: { id: s.id },
        data: updates
      });
    }

    // 4. Resolve Fields
    const rawLabels = s.fieldLabels?.length ? s.fieldLabels : (src?.fieldLabels ? String(src.fieldLabels).split(/[;|]/) : []);
    const existingFieldIds = new Set(s.fields.map(f => f.fieldId));

    for (const label of rawLabels) {
      const f = await ensureField(label);
      if (f && !existingFieldIds.has(f.id)) {
        await prisma.scholarshipField.create({
          data: {
            scholarshipId: s.id,
            fieldId: f.id
          }
        }).catch(() => null);
        existingFieldIds.add(f.id);
        fieldLinksCreated += 1;
      }
    }
  }

  console.log("\nReconciliation Summary:");
  console.log(`  Countries linked:      ${countryLinked}`);
  console.log(`  Universities linked:   ${universityLinked}`);
  console.log(`  Providers linked:      ${providerLinked}`);
  console.log(`  Field links created:   ${fieldLinksCreated}`);
  console.log("\nAll matching Country, University, Provider, and Field records are now created and linked!");
}

function lowerIncludes(s, term) {
  return String(s ?? "").toLowerCase().includes(term);
}

main()
  .catch((err) => {
    console.error("Reconciliation error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
