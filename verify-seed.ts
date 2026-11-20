import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  try {
    // Check scholarships with intakes
    const scholarships = await prisma.scholarship.findMany({
      where: {
        intakes: {
          some: { intake: { slug: "september-2027" } }
        }
      },
      include: {
        intakes: { include: { intake: true } },
        country: true,
        university: true,
      },
      take: 5,
    });
    console.log("Scholarships with September 2027 intake:");
    for (const s of scholarships) {
      console.log(`  - ${s.title} (${s.country?.name || s.countryNameLegacy}) - Intakes: ${s.intakes.map(i => i.intake.name).join(", ")}`);
    }

    // Check all intakes
    const intakes = await prisma.intake.findMany({
      include: { _count: { select: { scholarships: true } } },
      orderBy: [{ startYear: "desc" }, { startMonth: "desc" }],
    });
    console.log("\nAll intakes:");
    for (const i of intakes) {
      console.log(`  - ${i.name} (${i.startMonth}/${i.startYear}) - ${i._count.scholarships} scholarships - Active: ${i.isActive}`);
    }

    // Check specific scholarships
    const specific = await prisma.scholarship.findMany({
      where: {
        id: { in: ["sch-uk-001", "sch-eu-001", "sch-asia-001"] }
      },
      include: {
        intakes: { include: { intake: true } },
        country: true,
      },
    });
    console.log("\nSpecific scholarships:");
    for (const s of specific) {
      console.log(`  - ${s.id}: ${s.title} - Intakes: ${s.intakes.map(i => i.intake.name).join(", ")} - Country: ${s.country?.name}`);
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

verify();