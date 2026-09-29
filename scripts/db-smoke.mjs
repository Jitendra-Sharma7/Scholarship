/**
 * Read-only health check for the database a deployment is pointed at.
 *
 * Deployment decisions (apply a schema push, restart, roll back) are made while
 * holding this project's rule of never assuming persistence or success. This
 * script is the evidence for that decision: it connects, reports the row counts
 * that drive public pages, and reports anything that would make those pages
 * wrong. It never writes, and it never exits 0 on a failed check.
 *
 * Usage: npm run db:smoke
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const failures = [];
const notes = [];

function check(label, ok, detail) {
  if (ok) {
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures.push(label);
    console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function count(model, where) {
  return prisma[model].count({ where });
}

function groupBy(list) {
  const out = new Map();
  for (const item of list) out.set(item, (out.get(item) ?? 0) + 1);
  return out;
}

try {
  const url = process.env.DATABASE_URL ?? "";
  const target = url.replace(/:[^:@/]*@/, ":***@");
  console.log(`Database smoke check against ${target || "(DATABASE_URL unset)"}\n`);

  if (!url) {
    failures.push("DATABASE_URL is not set");
    console.error("  FAIL  DATABASE_URL is not set");
  }

  console.log("Connectivity");
  await prisma.$queryRaw`SELECT 1`;
  check("connection established", true);

  console.log("\nSchema");
  const expected = [
    "User",
    "Session",
    "Setting",
    "Country",
    "University",
    "Field",
    "Scholarship",
    "BlogPost",
    "Resource",
  ];
  for (const model of expected) {
    const exists = prisma[model] !== undefined;
    if (!exists) {
      failures.push(`model ${model} is missing`);
      console.error(`  FAIL  model ${model} is missing — run prisma db push`);
    } else {
      console.log(`  PASS  model ${model} present`);
    }
  }

  console.log("\nPublic read model");
  const published = await count("Scholarship", { publishStatus: "PUBLISHED", deletedAt: null });
  const total = await count("Scholarship");
  const trashed = await count("Scholarship", { deletedAt: { not: null } });
  const countries = await count("Country");
  const universities = await count("University");
  const fields = await count("Field");

  check("published scholarships", published > 0, `${published} of ${total}`);
  check("countries seeded", countries > 0, `${countries}`);
  check("universities seeded", universities > 0, `${universities}`);
  check("fields of study seeded", fields > 0, `${fields}`);

  const statusSplit = groupBy(
    (await prisma.scholarship.findMany({ select: { publishStatus: true } })).map((r) => r.publishStatus),
  );
  notes.push(
    `publishStatus: ${[...statusSplit].map(([k, v]) => `${k}=${v}`).join(", ") || "none"}`,
  );
  notes.push(`soft-deleted scholarships: ${trashed}`);

  const byDeadline = await count("Scholarship", {
    publishStatus: "PUBLISHED",
    deletedAt: null,
    deadline: { lt: new Date() },
  });
  notes.push(`published with a past deadline (intentional: expired stays visible): ${byDeadline}`);

  const live = await prisma.scholarship.findMany({
    where: { publishStatus: "PUBLISHED", deletedAt: null, applicationUrl: { not: null } },
    select: { applicationUrl: true },
  });
  const bad = live.filter((r) => {
    try {
      return !/^https?:$/.test(new URL(r.applicationUrl).protocol);
    } catch {
      return true;
    }
  });
  check(
    "published application URLs parse",
    bad.length === 0,
    bad.length ? `${bad.length} malformed` : `${live.length} checked`,
  );

  const withoutLink = await count("Scholarship", {
    publishStatus: "PUBLISHED",
    deletedAt: null,
    OR: [{ applicationUrl: null }, { applicationUrl: "" }],
  });
  if (withoutLink > 0) {
    notes.push(`published without an application URL (shown as unavailable, not as a dead link): ${withoutLink}`);
  }

  console.log("\nAdministrative baseline");
  const admins = await count("User", { role: { in: ["ADMIN", "SUPER_ADMIN"] } });
  const editors = await count("User", { role: "EDITOR" });
  check("an account can reach /admin", admins > 0, `${admins} admin, ${editors} editor`);
  if (admins === 0) {
    notes.push("No admin account exists. Create one before going live: /auth/register does not grant staff access.");
  }

  const settings = await count("Setting");
  notes.push(`site settings rows: ${settings}`);

  console.log("\nNotes");
  for (const note of notes) console.log(`  - ${note}`);

  console.log();
  if (failures.length) {
    console.error(`db:smoke FAILED — ${failures.length} check(s) did not pass:`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exitCode = 1;
  } else {
    console.log("db:smoke passed. The database is reachable and the public read model has data.");
  }
} catch (error) {
  console.error("\ndb:smoke FAILED — the database could not be read.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
