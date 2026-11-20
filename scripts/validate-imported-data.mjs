import { readFileSync, existsSync } from "node:fs";

const jsonRaw = readFileSync("data/scholarships-archive-2027.json", "utf8");
const jsonRecords = JSON.parse(jsonRaw);

console.log(`Validated JSON: ${jsonRecords.length} records parsed successfully.`);

let missingTitle = 0;
let missingCountry = 0;
let missingLevel = 0;
let missingDeadline = 0;

jsonRecords.forEach((r, idx) => {
  if (!r.title) missingTitle++;
  if (!r.country) missingCountry++;
  if (!r.degreeLevels) missingLevel++;
  if (!r.deadline) missingDeadline++;
});

console.log(`Missing titles: ${missingTitle}`);
console.log(`Missing countries: ${missingCountry}`);
console.log(`Missing degreeLevels: ${missingLevel}`);
console.log(`Missing deadlines: ${missingDeadline}`);

const csvRaw = readFileSync("data/scholarships-archive-2027.csv", "utf8");
const csvLines = csvRaw.trim().split("\n");
console.log(`Validated CSV: ${csvLines.length - 1} rows + 1 header.`);
