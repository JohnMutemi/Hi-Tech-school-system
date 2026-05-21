/**
 * One-time production repair: align each student's portal login email with their admission number,
 * remove orphan student users. Does NOT delete inactive students unless --purge-inactive is passed.
 *
 * Usage:
 *   node scripts/repair-student-login-emails.js waitaprogressiveacademy
 *   node scripts/repair-student-login-emails.js waitaprogressiveacademy --purge-inactive
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function buildStudentLoginEmail(admissionNumber, schoolCode) {
  const normalizedAdmission = String(admissionNumber)
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  const normalizedSchoolCode = schoolCode.trim().toLowerCase();
  return `student-${normalizedAdmission}-${normalizedSchoolCode}@student.local`;
}

function normalizeAdmission(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

async function findAvailableEmail(admissionNumber, schoolCode, excludeUserId) {
  const base = buildStudentLoginEmail(admissionNumber, schoolCode);
  const conflict = await prisma.user.findFirst({
    where: {
      email: base,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });
  if (!conflict) return base;

  const normAdm = normalizeAdmission(admissionNumber);
  const normSchool = schoolCode.trim().toLowerCase();
  for (let n = 1; n <= 50; n++) {
    const candidate = `student-${normAdm}-${normSchool}-${n}@student.local`;
    const taken = await prisma.user.findFirst({
      where: {
        email: candidate,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `student-${normAdm}-${normSchool}-${Date.now()}@student.local`;
}

async function repairSchool(school, options = {}) {
  const summary = {
    schoolCode: school.code,
    emailsFixed: 0,
    orphansRemoved: 0,
    inactivePurged: 0,
  };

  if (!options.purgeInactive) {
    const inactiveCount = await prisma.student.count({
      where: { schoolId: school.id, isActive: false },
    });
    if (inactiveCount > 0) {
      console.log(
        `  Skipping ${inactiveCount} inactive student(s). Pass --purge-inactive to remove them.`
      );
    }
  }

  const inactive = options.purgeInactive
    ? await prisma.student.findMany({
        where: { schoolId: school.id, isActive: false },
        select: { id: true, admissionNumber: true },
      })
    : [];

  for (const ghost of inactive) {
    try {
      const paymentIds = await prisma.payment.findMany({
        where: { studentId: ghost.id },
        select: { id: true },
      });
      if (paymentIds.length) {
        await prisma.paymentNotificationLog.deleteMany({
          where: { paymentId: { in: paymentIds.map((p) => p.id) } },
        });
      }
      await prisma.promotionExclusion.deleteMany({ where: { studentId: ghost.id } });
      await prisma.promotionLog.deleteMany({ where: { studentId: ghost.id } });
      await prisma.studentPromotionRequest.deleteMany({ where: { studentId: ghost.id } });
      await prisma.studentArrear.deleteMany({ where: { studentId: ghost.id } });
      await prisma.studentYearlyBalance.deleteMany({ where: { studentId: ghost.id } });
      await prisma.studentFee.deleteMany({ where: { studentId: ghost.id } });
      await prisma.receipt.deleteMany({ where: { studentId: ghost.id } });
      await prisma.payment.deleteMany({ where: { studentId: ghost.id } });
      await prisma.paymentRequest.deleteMany({ where: { studentId: ghost.id } });
      await prisma.feeStatement.deleteMany({ where: { studentId: ghost.id } });
      await prisma.alumni.deleteMany({ where: { studentId: ghost.id } });
      await prisma.studentScore.deleteMany({ where: { studentId: ghost.id } });
      await prisma.studentGradeResult.deleteMany({ where: { studentId: ghost.id } });
      const row = await prisma.student.findUnique({
        where: { id: ghost.id },
        select: { userId: true },
      });
      if (row) {
        await prisma.student.delete({ where: { id: ghost.id } });
        await prisma.user.delete({ where: { id: row.userId } }).catch(() => {});
        summary.inactivePurged++;
      }
    } catch (err) {
      console.warn(`  Could not purge inactive ${ghost.admissionNumber}:`, err.message);
    }
  }

  const students = await prisma.student.findMany({
    where: { schoolId: school.id, isActive: true },
    include: { user: { select: { id: true, email: true } } },
  });

  for (const student of students) {
    const canonical = buildStudentLoginEmail(student.admissionNumber, school.code);
    if (student.user.email === canonical) continue;

    const occupant = await prisma.user.findUnique({
      where: { email: canonical },
      include: { studentProfile: { select: { id: true, admissionNumber: true } } },
    });

    if (occupant && occupant.id !== student.user.id) {
      if (!occupant.studentProfile) {
        await prisma.user.delete({ where: { id: occupant.id } });
        summary.orphansRemoved++;
      } else if (occupant.studentProfile.id !== student.id) {
        const fixed = await findAvailableEmail(
          occupant.studentProfile.admissionNumber,
          school.code,
          occupant.id
        );
        await prisma.user.update({
          where: { id: occupant.id },
          data: { email: fixed },
        });
        summary.emailsFixed++;
      }
    }

    await prisma.user.update({
      where: { id: student.user.id },
      data: { email: canonical },
    });
    summary.emailsFixed++;
    console.log(`  ${student.admissionNumber}: ${student.user.email} -> ${canonical}`);
  }

  const orphanStudents = await prisma.user.findMany({
    where: {
      role: 'student',
      schoolId: school.id,
      studentProfile: null,
    },
    select: { id: true, email: true },
  });
  for (const orphan of orphanStudents) {
    await prisma.user.delete({ where: { id: orphan.id } });
    summary.orphansRemoved++;
    console.log(`  Removed orphan login: ${orphan.email}`);
  }

  return summary;
}

async function main() {
  const args = process.argv.slice(2);
  const purgeInactive = args.includes('--purge-inactive');
  const codeArg = args.find((a) => !a.startsWith('--'));
  const schools = await prisma.school.findMany({
    where: codeArg
      ? { code: { equals: codeArg, mode: 'insensitive' } }
      : undefined,
    select: { id: true, code: true },
  });

  if (schools.length === 0) {
    console.error('No school found.');
    process.exit(1);
  }

  console.log(`Repairing ${schools.length} school(s)...`);
  for (const school of schools) {
    console.log(`\n=== ${school.code} ===`);
    const summary = await repairSchool(school, { purgeInactive });
    console.log('Summary:', summary);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
