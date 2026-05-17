/**
 * Backfill public website sections for schools created before the website feature.
 * Run: npx tsx scripts/backfill-school-websites.ts
 */
import { PrismaClient } from "@prisma/client";
import { SchoolWebsiteSeedingService } from "../lib/services/school-website-seeding-service";

const prisma = new PrismaClient();

async function main() {
  const schools = await prisma.school.findMany({
    include: { _count: { select: { websiteSections: true } } },
  });

  let seeded = 0;
  for (const school of schools) {
    if (school._count.websiteSections > 0) continue;
    await SchoolWebsiteSeedingService.seedForSchool(
      school.id,
      school.name,
      school.websiteTemplateSlug,
      {
        motto: school.motto ?? undefined,
        principalName: school.principalName ?? undefined,
        description: school.description ?? undefined,
        address: school.address,
        establishedYear: school.establishedYear,
      }
    );
    seeded += 1;
    console.log(`Seeded website sections for ${school.code}`);
  }

  console.log(`Done. Seeded ${seeded} of ${schools.length} schools.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
