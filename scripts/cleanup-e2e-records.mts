/**
 * Removes records left behind by the scholarship CRUD verification script.
 *
 * Run after a failed or partial verification so repeated runs do not pollute the
 * seeded dataset. Only rows matching the script's own title prefixes are touched.
 */
import { prisma } from "@/lib/prisma";

const PREFIXES = ["E2E Verification Scholarship", "DEBUG valid create", "E2E missing deadline"];

async function main() {
  const { count } = await prisma.scholarship.deleteMany({
    where: { title: { startsWith: PREFIXES[0] } },
  });
  let extra = 0;
  for (const prefix of PREFIXES.slice(1)) {
    const r = await prisma.scholarship.deleteMany({
      where: { title: { startsWith: prefix } },
    });
    extra += r.count;
  }

  const remaining = await prisma.scholarship.count();
  console.log(`Removed ${count + extra} verification record(s).`);
  console.log(`Scholarships remaining: ${remaining}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
