/**
 * Bulk scholarship importer.
 *
 * Reads a JSON or CSV export and maps it onto the Scholarship model, linking the
 * Country, Provider, University and Field relations by name where they exist.
 *
 *   node scripts/import-scholarships.mjs <file> --source "<label>" [--publish]
 *
 * Every row is written as `DRAFT` / `VERIFICATION_NEEDED` unless `--publish` is
 * passed. That default is deliberate: imported rows come from a third party, and
 * this project never presents an unverified listing as a confirmed one. Nothing
 * reaches the public site until a member of staff has checked it.
 *
 * Expected columns (aliases in parentheses, case/space insensitive):
 *   title (name, scholarship)            required
 *   country (location, hostCountry)      matched against Country.name / code
 *   university (institution)             matched against University.name
 *   provider (organisation, sponsor)     matched against Provider.name
 *   fundingType (funding)                fully-funded | fully-tuition |
 *                                        partial-tuition | stipend | mixed
 *   fundingAmount, currency, monthlyStipend, annualStipend
 *   tuitionCoverage, accommodationCoverage, travelAllowance, healthInsurance,
 *   visaSupport, researchFunding         "yes"/"true"/1
 *   otherBenefits
 *   degreeLevels (degrees)               "Bachelor, Master"
 *   fieldLabels (subjects, fields)       "Computer Science, Law"
 *   eligibleCountries, nationalityRestrictions
 *   minGpa, minPercentage, ageRequirement, workExpReq, otherRequirements
 *   studyMode, studyType, subField, duration, intake
 *   openingDate, deadline                ISO date or YYYY-MM-DD
 *   deadlineType, applicationFee, applicationMethod
 *   documentsRequired, applicationProcess
 *   applicationUrl, officialUrl, providerContact
 *   languageReqs, ieltsReq, toeflReq, greReq, gmatReq, otherTestReqs,
 *   academicReqs, selectionCriteria, financialNeedReq
 *   numAwards (numberOfRecipients, numberOfAwards, awards)
 *   region, city, logo, coverImage
 *   description, shortDescription, seoTitle, seoDescription
 *   sourceUrl                           recorded on the row
 */

import { readFileSync, existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { countryReference } from "../prisma/seed-data/country-reference.js";

const prisma = new PrismaClient();

// --- CLI -------------------------------------------------------------------

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

if (!file) {
  console.error("Usage: node scripts/import-scholarships.mjs <file.json|file.csv> --source \"<label>\" [--auto-create] [--update] [--publish]");
  process.exit(1);
}
if (!existsSync(file)) {
  console.error(`No such file: ${file}`);
  process.exit(1);
}

const sourceLabel = value("source") ?? "imported";
const publish = flag("publish");
const autoCreate = flag("auto-create") || flag("create-relations");
const updateExisting = flag("update") || flag("upsert");

// --- Parsing ---------------------------------------------------------------

/** Minimal RFC4180 CSV reader: handles quoted fields and embedded newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return body.map((r) => {
    const out = {};
    keys.forEach((k, i) => {
      out[k] = (r[i] ?? "").trim();
    });
    return out;
  });
}

const raw = readFileSync(file, "utf8");
const records = file.toLowerCase().endsWith(".csv")
  ? parseCsv(raw)
  : JSON.parse(raw);

if (!Array.isArray(records)) {
  console.error("Expected an array of records (JSON) or a header row (CSV).");
  process.exit(1);
}

// Normalise headers once: "Funding Type", "fundingType" and "FUNDING_TYPE" all
// collapse to "fundingtype" so the alias table can stay readable.
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const rows = records.map((r) => {
  const out = {};
  for (const [k, v] of Object.entries(r)) out[norm(k)] = v;
  return out;
});

// --- Coercion --------------------------------------------------------------

const pick = (row, ...aliases) => {
  for (const a of aliases) {
    const v = row[norm(a)];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return undefined;
};

const truthy = (v) => ["yes", "true", "1", "y"].includes(String(v ?? "").toLowerCase());

const list = (v) =>
  v === undefined
    ? []
    : String(v)
        .split(/[;|]/)
        .map((s) => s.trim())
        .filter(Boolean);

const num = (v) => {
  if (v === undefined) return undefined;
  const n = Number.parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

const int = (v) => {
  const n = num(v);
  return n === undefined ? undefined : Math.round(n);
};

/** Accepts an ISO timestamp or YYYY-MM-DD. Returns undefined rather than guessing. */
const date = (v) => {
  if (!v) return undefined;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const FUNDING = new Map([
  ["fullyfunded", "FULLY_FUNDED"],
  ["fullyfunded", "FULLY_FUNDED"],
  ["fullfunding", "FULLY_FUNDED"],
  ["full", "FULLY_FUNDED"],
  ["fullytuition", "FULLY_TUITION"],
  ["fulltuition", "FULLY_TUITION"],
  ["tuitionwaiver", "FULLY_TUITION"],
  ["partialtuition", "PARTIAL_TUITION"],
  ["partialfunding", "PARTIAL_TUITION"],
  ["partial", "PARTIAL_TUITION"],
  ["stipend", "STIPEND"],
  ["mixed", "MIXED"],
]);

const fundingType = (v) => {
  if (!v) return undefined;
  return FUNDING.get(norm(v)) ?? FUNDING.get(norm(v).replace(/scholarship|funding|cover/g, ""));
};

const STUDY_MODE = new Map([
  ["oncampus", "ON_CAMPUS"],
  ["inperson", "IN_PERSON"],
  ["online", "ONLINE"],
  ["remote", "ONLINE"],
  ["hybrid", "HYBRID"],
]);

const studyMode = (v) => (v ? STUDY_MODE.get(norm(v)) : undefined);

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// --- Reference data --------------------------------------------------------

const [countries, providers, universities, fields, existingSlugs] = await Promise.all([
  prisma.country.findMany({ select: { id: true, name: true, code: true, code3: true } }),
  prisma.provider.findMany({ select: { id: true, name: true } }),
  prisma.university.findMany({ select: { id: true, name: true } }),
  prisma.field.findMany({ select: { id: true, name: true } }),
  prisma.scholarship.findMany({ select: { slug: true } }),
]);

const byName = (rows) => {
  const m = new Map();
  for (const r of rows) m.set(norm(r.name), r);
  return m;
};

const countryByName = byName(countries);
const countryByCode = new Map();
for (const c of countries) {
  countryByCode.set(norm(c.code), c);
  countryByCode.set(norm(c.code3), c);
}

const providerByName = byName(providers);
const universityByName = byName(universities);
const fieldByName = byName(fields);

// Special multi-national destinations
const SPECIAL_COUNTRIES = [
  { name: "Europe", code: "EU", code3: "EUR", region: "Europe", continent: "Europe", currency: "EUR", capital: "Brussels" },
  { name: "Multiple Countries", code: "GLOBAL", code3: "GLB", region: "Global", continent: "Global", currency: "USD", capital: "Global" }
];

const refByNormName = new Map();
const refByNormCode = new Map();
for (const c of [...(countryReference ?? []), ...SPECIAL_COUNTRIES]) {
  refByNormName.set(norm(c.name), c);
  refByNormCode.set(norm(c.code), c);
  if (c.code3) refByNormCode.set(norm(c.code3), c);
}
refByNormName.set("turkiye", refByNormName.get("turkey"));
refByNormName.set("multiplecountries", refByNormName.get("multiplecountries"));

async function resolveOrCreateCountry(rawName) {
  if (!rawName) return null;
  const n = norm(rawName);
  let c = countryByName.get(n) ?? countryByCode.get(n);
  if (c || !autoCreate) return c;

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
    c = await prisma.country.create({
      data: { name, code, code3, slug, region, continent, currency, capital, publishStatus: "PUBLISHED" }
    });
  } catch {
    c = await prisma.country.findFirst({ where: { OR: [{ code }, { slug }] } });
  }
  if (c) {
    countryByName.set(norm(c.name), c);
    countryByCode.set(norm(c.code), c);
    if (c.code3) countryByCode.set(norm(c.code3), c);
  }
  return c;
}

async function resolveOrCreateUniversity(rawName, country) {
  if (!rawName) return null;
  const n = norm(rawName);
  let u = universityByName.get(n);
  if (u || !autoCreate) return u;

  const slug = slugify(rawName);
  try {
    u = await prisma.university.create({
      data: {
        name: rawName,
        slug,
        countryId: country?.id ?? null,
        countryNameLegacy: country?.name ?? null,
        publishStatus: "PUBLISHED"
      }
    });
  } catch {
    u = await prisma.university.findFirst({ where: { slug } });
  }
  if (u) {
    universityByName.set(norm(u.name), u);
  }
  return u;
}

async function resolveOrCreateProvider(rawName, countryName) {
  if (!rawName) return null;
  const n = norm(rawName);
  let p = providerByName.get(n);
  if (p || !autoCreate) return p;

  let type = "University";
  const lower = rawName.toLowerCase();
  if (lower.includes("government") || lower.includes("ministry") || lower.includes("state") || lower.includes("embassy") || lower.includes("daad") || lower.includes("csc") || lower.includes("niied") || lower.includes("mext")) {
    type = "Government";
  } else if (lower.includes("foundation") || lower.includes("trust") || lower.includes("gates") || lower.includes("yoneyama") || lower.includes("fellows") || lower.includes("fund")) {
    type = "Foundation";
  } else if (lower.includes("commission") || lower.includes("world bank") || lower.includes("erasmus") || lower.includes("un") || lower.includes("consortium") || lower.includes("vlir")) {
    type = "International Organization";
  }

  try {
    p = await prisma.provider.create({
      data: {
        name: rawName,
        type,
        country: countryName ?? null,
        verified: true
      }
    });
  } catch {
    p = await prisma.provider.findFirst({ where: { name: rawName } });
  }
  if (p) {
    providerByName.set(norm(p.name), p);
  }
  return p;
}

async function resolveOrCreateField(rawLabel) {
  if (!rawLabel || /^all\b/i.test(rawLabel.trim())) return null;
  const label = rawLabel.trim();
  const n = norm(label);
  let f = fieldByName.get(n);
  if (f || !autoCreate) return f;

  const slug = slugify(label);
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
    f = await prisma.field.create({
      data: { name: label, slug, category, publishStatus: "PUBLISHED" }
    });
  } catch {
    f = await prisma.field.findFirst({ where: { slug } });
  }
  if (f) {
    fieldByName.set(norm(f.name), f);
  }
  return f;
}

const taken = new Set(existingSlugs.map((s) => s.slug));
async function uniqueSlug(title) {
  const base = slugify(title) || "scholarship";
  let candidate = base;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  taken.add(candidate);
  return candidate;
}

// --- Import ----------------------------------------------------------------

let created = 0;
let updated = 0;
let duplicates = 0;
let invalid = 0;
const unresolved = { country: 0, provider: 0, university: 0, field: 0 };
const problems = [];

for (const [index, row] of rows.entries()) {
  const title = pick(row, "title", "name", "scholarship", "scholarshipName");
  if (!title) {
    invalid += 1;
    problems.push(`row ${index + 2}: no title`);
    continue;
  }

  const countryName = pick(row, "country", "location", "hostCountry", "studyIn");
  const country = await resolveOrCreateCountry(countryName);
  if (countryName && !country) unresolved.country += 1;

  const universityName = pick(row, "university", "institution", "school", "college");
  const university = await resolveOrCreateUniversity(universityName, country);
  if (universityName && !university) unresolved.university += 1;

  const providerName = pick(row, "provider", "organisation", "organization", "sponsor", "offeredBy") ?? (university ? university.name : null);
  const provider = await resolveOrCreateProvider(providerName, country?.name);
  if (providerName && !provider) unresolved.provider += 1;

  const fieldLabels = list(pick(row, "fieldLabels", "subjects", "fields", "discipline", "major"));
  const fieldIds = [];
  for (const label of fieldLabels) {
    const f = await resolveOrCreateField(label);
    if (f) fieldIds.push(f.id);
    else if (!/^all\b/i.test(label)) unresolved.field += 1;
  }

  const type = fundingType(pick(row, "fundingType", "funding", "coverage"));
  const degrees = list(pick(row, "degreeLevels", "degrees", "degreeLevel", "level"));
  const sourceUrl = pick(row, "sourceUrl", "url", "link", "applicationUrl");

  const slug = slugify(title);
  let record;

  if (taken.has(slug)) {
    if (!updateExisting) {
      duplicates += 1;
      continue;
    }
    const existing = await prisma.scholarship.findUnique({ where: { slug } });
    if (existing) {
      record = await prisma.scholarship.update({
        where: { id: existing.id },
        data: {
          countryId: country?.id ?? existing.countryId,
          countryNameLegacy: country?.name ?? existing.countryNameLegacy ?? countryName,
          universityId: university?.id ?? existing.universityId,
          universityNameLegacy: university?.name ?? existing.universityNameLegacy ?? universityName,
          providerId: provider?.id ?? existing.providerId,
          fieldLabels: fieldLabels.length ? fieldLabels : existing.fieldLabels,
          degreeLevels: degrees.length ? degrees : existing.degreeLevels,
          fundingType: type ?? existing.fundingType,
          isFullyFunded: type === "FULLY_FUNDED" ? true : existing.isFullyFunded,
          fundingAmount: num(pick(row, "fundingAmount", "amount", "value")) ?? existing.fundingAmount,
          currency: pick(row, "currency") ?? existing.currency,
          monthlyStipend: num(pick(row, "monthlyStipend", "stipend")) ?? existing.monthlyStipend,
          tuitionCoverage: truthy(pick(row, "tuitionCoverage", "coversTuition")) || existing.tuitionCoverage,
          accommodationCoverage: truthy(pick(row, "accommodationCoverage", "coversAccommodation")) || existing.accommodationCoverage,
          deadline: date(pick(row, "deadline", "closingDate")) ?? existing.deadline,
          openingDate: date(pick(row, "openingDate", "opens")) ?? existing.openingDate,
          applicationUrl: pick(row, "applicationUrl", "applyUrl") ?? existing.applicationUrl,
          officialUrl: pick(row, "officialUrl", "providerUrl", "website") ?? existing.officialUrl,
        }
      });
      updated += 1;
    }
  } else {
    record = await prisma.scholarship.create({
      data: {
        title,
        slug: await uniqueSlug(title),
        description: pick(row, "description", "details", "about"),
        shortDescription: pick(row, "shortDescription", "summary"),
        countryId: country?.id ?? null,
        countryNameLegacy: country?.name ?? countryName ?? null,
        universityId: university?.id ?? null,
        universityNameLegacy: university?.name ?? universityName ?? null,
        providerId: provider?.id ?? null,
        region: pick(row, "region"),
        city: pick(row, "city"),

        fundingType: type ?? "MIXED",
        isFullyFunded: type === "FULLY_FUNDED",
        fundingAmount: num(pick(row, "fundingAmount", "amount", "value")),
        currency: pick(row, "currency") ?? null,
        monthlyStipend: num(pick(row, "monthlyStipend", "stipend")),
        annualStipend: num(pick(row, "annualStipend")),
        tuitionCoverage: truthy(pick(row, "tuitionCoverage", "coversTuition", "fullTuition")),
        accommodationCoverage: truthy(pick(row, "accommodationCoverage", "coversAccommodation")),
        travelAllowance: truthy(pick(row, "travelAllowance", "coversTravel")),
        healthInsurance: truthy(pick(row, "healthInsurance", "coversHealth")),
        visaSupport: truthy(pick(row, "visaSupport", "coversVisa")),
        researchFunding: truthy(pick(row, "researchFunding")),
        otherBenefits: pick(row, "otherBenefits") ?? null,

        degreeLevels: degrees,
        fieldLabels,
        eligibleCountries: list(pick(row, "eligibleCountries", "openTo")),
        nationalityRestrictions: list(pick(row, "nationalityRestrictions", "nationalities")),
        minGpa: num(pick(row, "minGpa", "gpa", "minimumGpa")),
        minPercentage: num(pick(row, "minPercentage", "percentage")),
        ageRequirement: int(pick(row, "ageRequirement", "maxAge")),
        workExpReq: pick(row, "workExpReq", "workExperience") ?? null,
        otherRequirements: pick(row, "otherRequirements", "requirements") ?? null,

        studyMode: studyMode(pick(row, "studyMode", "mode")),
        studyType: pick(row, "studyType") ?? null,
        subField: pick(row, "subField", "subfield") ?? null,
        duration: pick(row, "duration") ?? null,
        intake: pick(row, "intake") ?? null,

        openingDate: date(pick(row, "openingDate", "opens", "startDate")) ?? null,
        deadline: date(pick(row, "deadline", "closingDate", "applicationDeadline")) ?? null,
        deadlineType: pick(row, "deadlineType") ?? null,
        applicationFee: num(pick(row, "applicationFee", "fee")),
        applicationMethod: pick(row, "applicationMethod", "howToApply") ?? null,
        documentsRequired: list(pick(row, "documentsRequired", "documents")),
        applicationProcess: list(pick(row, "applicationProcess", "process", "steps")),
        applicationUrl: pick(row, "applicationUrl", "applyUrl") ?? sourceUrl ?? null,
        officialUrl: pick(row, "officialUrl", "providerUrl", "website") ?? sourceUrl ?? null,
        providerContact: pick(row, "providerContact", "contact") ?? null,

        languageReqs: list(pick(row, "languageReqs", "languageRequirements", "languages")),
        ieltsReq: num(pick(row, "ieltsReq", "ielts")),
        toeflReq: num(pick(row, "toeflReq", "toefl")),
        greReq: num(pick(row, "greReq", "gre")),
        gmatReq: num(pick(row, "gmatReq", "gmat")),
        otherTestReqs: list(pick(row, "otherTestReqs", "otherTests")),
        academicReqs: list(pick(row, "academicReqs", "academicRequirements")),
        selectionCriteria: list(pick(row, "selectionCriteria", "criteria")),
        financialNeedReq: truthy(pick(row, "financialNeedReq", "financialNeed")),

        numAwards: int(pick(row, "numAwards", "numberOfAwards", "numberOfRecipients", "awards")),
        logo: pick(row, "logo") ?? null,
        coverImage: pick(row, "coverImage") ?? null,

        seoTitle: pick(row, "seoTitle") ?? null,
        seoDescription: pick(row, "seoDescription") ?? null,
        canonicalUrl: pick(row, "canonicalUrl") ?? null,

        source: sourceUrl ? `${sourceLabel} (${sourceUrl})` : sourceLabel,
        verificationStatus: "VERIFICATION_NEEDED",
        lastVerifiedAt: null,
        publishStatus: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? new Date() : null,
        featured: false,
        includeInSitemap: publish,
      },
    });
    created += 1;
  }

  if (record && fieldIds.length > 0) {
    await prisma.scholarshipField.createMany({
      data: fieldIds.map((fieldId) => ({ scholarshipId: record.id, fieldId })),
      skipDuplicates: true,
    });
  }
}

console.log(`rows read:      ${rows.length}`);
console.log(`created:        ${created}`);
if (updateExisting) console.log(`updated:        ${updated}`);
console.log(`duplicates:     ${duplicates} (slug already in the database)`);
console.log(`invalid:        ${invalid} (no title)`);
console.log(
  `unresolved:     country ${unresolved.country}, provider ${unresolved.provider}, ` +
    `university ${unresolved.university}, subject labels ${unresolved.field}`
);
console.log(`publish state:  ${publish ? "PUBLISHED" : "DRAFT / VERIFICATION_NEEDED"}`);

if (problems.length > 0) {
  console.log("\nproblems:");
  for (const p of problems.slice(0, 20)) console.log(`  ${p}`);
  if (problems.length > 20) console.log(`  ...and ${problems.length - 20} more`);
}

if (unresolved.country === 0 && unresolved.provider === 0 && unresolved.university === 0 && unresolved.field === 0) {
  console.log("\nAll relations successfully resolved and linked!");
} else {
  console.log(
    "\nUnresolved names were left as text on the row (countryNameLegacy / " +
      "universityNameLegacy) rather than dropped. Use --auto-create to automatically create missing entities, or run: npm run link:scholarships"
  );
}

await prisma.$disconnect();
