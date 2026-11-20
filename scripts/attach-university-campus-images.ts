import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Attach real university campus photographs to existing university records.
 *
 * URLs point to openly licensed campus photographs hosted on Wikimedia Commons.
 * They are best-effort: if a URL ever 404s, the directory's image component
 * falls back to a designed initials placeholder, so nothing breaks. No new
 * university records are created - existing rows are updated in place.
 *
 * Extend this map whenever editors publish new cover images through the CMS.
 */
const CAMPUS_PHOTOS: Record<string, string> = {
  // University of Oxford - Radcliffe Camera
  oxford: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Radcliffe_Camera.jpg/1200px-Radcliffe_Camera.jpg",
  // University of Cambridge - King's College Chapel
  cambridge: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/King%27s_College_Chapel%2C_Cambridge.jpg/1200px-King%27s_College_Chapel%2C_Cambridge.jpg",
  // Harvard University - Harvard Yard
  harvard: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Harvard_Yard.jpg/1200px-Harvard_Yard.jpg",
  // Massachusetts Institute of Technology - Great Dome
  mit: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/MIT_Great_Dome.jpg/1200px-MIT_Great_Dome.jpg",
  // Australian National University - Union Court
  anu: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/ANU_Union_Court.jpg/1200px-ANU_Union_Court.jpg",
  // University of Toronto - University College
  toronto: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/University_College_%28University_of_Toronto%29.jpg/1200px-University_College_%28University_of_Toronto%29.jpg",
  // University of Melbourne - Old Arts Building
  melbourne: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Old_Arts_Building%2C_University_of_Melbourne.jpg/1200px-Old_Arts_Building%2C_University_of_Melbourne.jpg",
  // ETH Zurich - Main Building
  eth: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/ETH_Zurich_Main_Building.jpg/1200px-ETH_Zurich_Main_Building.jpg",
  // Delft University of Technology - Aula Conference Centre
  delft: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/TU_Delft_Aula.jpg/1200px-TU_Delft_Aula.jpg",
  // Aalto University - Otaniemi campus
  aalto: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Aalto_University%2C_Otaniemi.jpg/1200px-Aalto_University%2C_Otaniemi.jpg",
};

async function main() {
  const universityIds = Object.keys(CAMPUS_PHOTOS);
  const existing = await prisma.university.findMany({
    where: {
      id: { in: universityIds },
      publishStatus: "PUBLISHED",
      deletedAt: null,
    },
    select: { id: true, name: true, coverImage: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const row of existing) {
    const url = CAMPUS_PHOTOS[row.id];
    if (!url) {
      skipped += 1;
      continue;
    }
    if (row.coverImage === url) {
      skipped += 1;
      continue;
    }
    await prisma.university.update({
      where: { id: row.id },
      data: { coverImage: url },
    });
    updated += 1;
    console.log(`Updated ${row.name} (${row.id})`);
  }

  const missing = universityIds.filter(
    (id) => !existing.some((row) => row.id === id)
  );
  for (const id of missing) {
    console.log(`Skipped ${id}: no published university record found`);
    skipped += 1;
  }

  console.log(`Done: ${updated} updated, ${skipped} skipped.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
