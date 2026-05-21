const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const code = process.argv[2] || 'waitaprogressiveacademy';
  const school = await p.school.findFirst({
    where: { code: { equals: code, mode: 'insensitive' } },
    select: { id: true, code: true },
  });
  if (!school) {
    console.log('School not found');
    return;
  }
  const backups = await p.schoolBackup.findMany({
    where: { schoolId: school.id },
    select: { id: true, label: true, createdAt: true, status: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log(`Backups for ${school.code}:`, JSON.stringify(backups, null, 2));
  const inactive = await p.student.count({
    where: { schoolId: school.id, isActive: false },
  });
  console.log('Inactive students remaining:', inactive);
}

main().finally(() => p.$disconnect());
