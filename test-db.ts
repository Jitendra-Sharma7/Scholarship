import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  try {
    const count = await prisma.scholarship.count();
    console.log("Scholarships:", count);
    const intakes = await prisma.intake.findMany();
    console.log("Intakes:", intakes);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();