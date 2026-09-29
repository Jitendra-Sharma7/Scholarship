/**
 * Removes the records that the verification scripts leave behind.
 *
 * The verification suites drive the real admin UI, so they create real rows.
 * Left alone, those rows inflate the public counts on the homepage and sit in
 * the admin activity log as noise. This script finds them by the markers the
 * suites use and deletes them, including the activity log entries.
 *
 * Dry run by default. Pass --apply to delete.
 */
import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");

const prisma = new PrismaClient();

const SCHOLARSHIP_MARKER = "E2E Verification Scholarship";
const POST_MARKER = "Verification Post";
const COUNTRY_SLUG = "verify-land";
const SUBMITTER = "Verification Script";

const ACTIVITY_MARKERS = [
  SCHOLARSHIP_MARKER,
  POST_MARKER,
  COUNTRY_SLUG,
  SUBMITTER,
  "Verify Land",
];

const activityFilter = {
  OR: ACTIVITY_MARKERS.map((marker) => ({ summary: { contains: marker } })),
};

const plan = [
  {
    label: "scholarships",
    find: () =>
      prisma.scholarship.findMany({
        where: { title: { contains: SCHOLARSHIP_MARKER } },
        select: { id: true, title: true, publishStatus: true, deletedAt: true },
      }),
    remove: () =>
      prisma.scholarship.deleteMany({
        where: { title: { contains: SCHOLARSHIP_MARKER } },
      }),
  },
  {
    label: "blog posts",
    find: () =>
      prisma.blogPost.findMany({
        where: { title: { contains: POST_MARKER } },
        select: { id: true, title: true },
      }),
    remove: () =>
      prisma.blogPost.deleteMany({ where: { title: { contains: POST_MARKER } } }),
  },
  {
    label: "countries",
    find: () =>
      prisma.country.findMany({
        where: { slug: { startsWith: COUNTRY_SLUG } },
        select: { id: true, name: true, slug: true },
      }),
    remove: () =>
      prisma.country.deleteMany({ where: { slug: { startsWith: COUNTRY_SLUG } } }),
  },
  {
    label: "submissions",
    find: () =>
      prisma.submission.findMany({
        where: { submitterName: SUBMITTER },
        select: { id: true, submitterName: true, submitterEmail: true, status: true },
      }),
    remove: () =>
      prisma.submission.deleteMany({ where: { submitterName: SUBMITTER } }),
  },
  {
    label: "activity log",
    find: () =>
      prisma.activityLog.findMany({
        where: activityFilter,
        select: { id: true, entityType: true, summary: true },
      }),
    remove: () => prisma.activityLog.deleteMany({ where: activityFilter }),
  },
];

const show = (rows) => {
  for (const row of rows.slice(0, 8)) console.log("   ", JSON.stringify(row));
  if (rows.length > 8) console.log(`    ...and ${rows.length - 8} more`);
};

let total = 0;
for (const step of plan) {
  const rows = await step.find();
  total += rows.length;
  if (rows.length === 0) continue;
  console.log(`\n${step.label}: ${rows.length}`);
  show(rows);
  if (APPLY) {
    const { count } = await step.remove();
    console.log(`    removed ${count}`);
  }
}

console.log(
  APPLY
    ? `\nRemoved ${total} test record(s).`
    : `\n${total} test record(s) found. Re-run with --apply to delete them.`
);

await prisma.$disconnect();
