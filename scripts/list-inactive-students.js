/**
 * READ-ONLY: list inactive student rows for manual review. Does not delete anything.
 *
 * Usage:
 *   node scripts/list-inactive-students.js waitaprogressiveacademy
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const code = process.argv[2] || 'waitaprogressiveacademy';
  const school = await p.school.findFirst({
    where: { code: { equals: code, mode: 'insensitive' } },
    select: { id: true, code: true },
  });
  if (!school) {
    console.error('School not found');
    process.exit(1);
  }

  const inactive = await p.student.findMany({
    where: { schoolId: school.id, isActive: false },
    select: {
      id: true,
      admissionNumber: true,
      parentName: true,
      parentPhone: true,
      status: true,
      updatedAt: true,
      user: { select: { name: true } },
    },
    orderBy: { admissionNumber: 'asc' },
  });

  console.log(`\nInactive students for ${school.code}: ${inactive.length}\n`);
  if (inactive.length === 0) {
    console.log('(none — good)');
    return;
  }

  console.log('ADM\tStudent name\t\t\tParent\t\t\tStatus\t\tUpdated');
  console.log('-'.repeat(90));
  for (const s of inactive) {
    console.log(
      [
        s.admissionNumber,
        (s.user?.name || '').slice(0, 24).padEnd(24),
        (s.parentName || '').slice(0, 20).padEnd(20),
        s.status,
        s.updatedAt.toISOString().slice(0, 10),
        `id:${s.id}`,
      ].join('\t')
    );
  }
  console.log('\nTo remove one via API: DELETE /api/schools/{code}/students with body { "admissionNumber": "..." }');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
