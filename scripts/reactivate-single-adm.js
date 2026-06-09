/**
 * Reactivate ONE student by school code + admission number + expected student ID.
 * Refuses to run if the target is ambiguous or already active.
 *
 * Usage:
 *   node scripts/reactivate-single-adm.js waitaprogressiveacademy 1306 f44370a5-46a7-4191-af43-662eb32dd095
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const schoolCode = process.argv[2];
  const admissionNumber = process.argv[3];
  const expectedStudentId = process.argv[4];

  if (!schoolCode || !admissionNumber || !expectedStudentId) {
    console.error(
      'Usage: node scripts/reactivate-single-adm.js <schoolCode> <admissionNumber> <expectedStudentId>'
    );
    process.exit(1);
  }

  const school = await p.school.findFirst({
    where: { code: { equals: schoolCode, mode: 'insensitive' } },
    select: { id: true, code: true },
  });
  if (!school) {
    console.error('School not found:', schoolCode);
    process.exit(1);
  }

  const matches = await p.student.findMany({
    where: {
      schoolId: school.id,
      admissionNumber,
    },
    select: {
      id: true,
      admissionNumber: true,
      isActive: true,
      status: true,
      user: { select: { id: true, name: true, isActive: true } },
    },
  });

  if (matches.length !== 1) {
    console.error(
      `Refusing to update: expected exactly 1 student for adm ${admissionNumber}, found ${matches.length}.`
    );
    process.exit(1);
  }

  const target = matches[0];
  if (target.id !== expectedStudentId) {
    console.error(
      `Refusing to update: student id mismatch (got ${target.id}, expected ${expectedStudentId}).`
    );
    process.exit(1);
  }

  if (target.isActive) {
    console.log('Already active — no changes made.');
    console.log(JSON.stringify(target, null, 2));
    return;
  }

  const result = await p.$transaction(async (tx) => {
    const updated = await tx.student.updateMany({
      where: {
        id: expectedStudentId,
        schoolId: school.id,
        admissionNumber,
        isActive: false,
      },
      data: {
        isActive: true,
        status: 'active',
      },
    });

    if (updated.count !== 1) {
      throw new Error(`Expected to update 1 student row, updated ${updated.count}.`);
    }

    await tx.user.updateMany({
      where: {
        id: target.user.id,
        studentProfile: { id: expectedStudentId },
      },
      data: { isActive: true },
    });

    return tx.student.findUnique({
      where: { id: expectedStudentId },
      select: {
        id: true,
        admissionNumber: true,
        isActive: true,
        status: true,
        classId: true,
        user: { select: { id: true, name: true, email: true, isActive: true } },
        school: { select: { code: true } },
      },
    });
  });

  console.log('Reactivated successfully:');
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
