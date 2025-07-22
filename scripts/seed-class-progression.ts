image.pngimport { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Example usage: node scripts/seed-class-progression.ts <schoolId>
const schoolId = process.argv[2];
if (!schoolId) {
  console.error('Usage: node scripts/seed-class-progression.ts <schoolId>');
  process.exit(1);
}

// List your class names in order here:
const classNames = [
  'Grade 1A',
  'Grade 2A',
  'Grade 3A',
  'Grade 4A',
  'Grade 5A',
  'Grade 6A',
];

async function main() {
  for (let i = 0; i < classNames.length - 1; i++) {
    const fromClass = classNames[i];
    const toClass = classNames[i + 1];
    // Check if progression already exists
    const exists = await prisma.classProgression.findFirst({
      where: { schoolId, fromClass, isActive: true },
    });
    if (!exists) {
      await prisma.classProgression.create({
        data: {
          schoolId,
          fromClass,
          toClass,
          order: i + 1,
          isActive: true,
          fromGrade: fromClass.split(' ')[0],
          toGrade: toClass.split(' ')[0],
          fromAcademicYear: '2025', // Adjust as needed
          toAcademicYear: '2026',   // Adjust as needed
        },
      });
      console.log(`Created progression: ${fromClass} -> ${toClass}`);
    } else {
      console.log(`Progression already exists: ${fromClass} -> ${toClass}`);
    }
  }
  console.log('Done!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
}); 