import { seedCountries } from "../prisma/seed-data/countries.js";
import { seedUniversities } from "../prisma/seed-data/universities.js";
import { seedProviders } from "../prisma/seed-data/providers.js";
import { seedFields } from "../prisma/seed-data/fields.js";
import { readFileSync } from "node:fs";

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

const records = JSON.parse(readFileSync("data/scholarships-archive-2027.json", "utf8"));

const countryNames = new Set(seedCountries.map(c => norm(c.name)));
seedCountries.forEach(c => countryNames.add(norm(c.code)));

const uniNames = new Set(seedUniversities.map(u => norm(u.name)));
const providerNames = new Set(seedProviders.map(p => norm(p.name)));
const fieldNames = new Set(seedFields.map(f => norm(f.name)));

const missing = {
  countries: new Set(),
  universities: new Set(),
  providers: new Set(),
  fields: new Set()
};

for (const r of records) {
  if (r.country && !countryNames.has(norm(r.country))) {
    missing.countries.add(r.country);
  }
  if (r.university && !uniNames.has(norm(r.university))) {
    missing.universities.add(r.university);
  }
  if (r.provider && !providerNames.has(norm(r.provider))) {
    missing.providers.add(r.provider);
  }
  if (r.fieldLabels) {
    const list = String(r.fieldLabels).split(/[;|]/).map(s => s.trim()).filter(Boolean);
    for (const f of list) {
      if (!fieldNames.has(norm(f)) && !/^all\b/i.test(f)) {
        missing.fields.add(f);
      }
    }
  }
}

console.log("Missing Countries:", Array.from(missing.countries));
console.log("Missing Universities:", Array.from(missing.universities));
console.log("Missing Providers:", Array.from(missing.providers));
console.log("Missing Fields (sample 20):", Array.from(missing.fields).slice(0, 20));
console.log(`Total missing: ${missing.countries.size} countries, ${missing.universities.size} universities, ${missing.providers.size} providers, ${missing.fields.size} fields.`);
