import { seedSystemPresets } from '../modules/grading-module/services/gradingScaleService';

async function main() {
  await seedSystemPresets();
  console.log('Grading module system presets seeded (CBC Upper Primary, CBC Junior Secondary, 8-4-4).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import('../lib/prisma');
    await prisma.$disconnect();
  });
