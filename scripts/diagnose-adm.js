const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const adm = process.argv[2] || '1254';
  const schools = await p.school.findMany({
    where: { code: { contains: 'waita', mode: 'insensitive' } },
    select: { id: true, code: true },
  });
  console.log('Schools:', schools);

  for (const school of schools) {
    const students = await p.student.findMany({
      where: {
        schoolId: school.id,
        OR: [
          { admissionNumber: adm },
          { admissionNumber: { contains: adm } },
        ],
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });
    console.log(`\n--- ${school.code} students matching ${adm} ---`);
    console.log(JSON.stringify(students, null, 2));

    const users = await p.user.findMany({
      where: {
        schoolId: school.id,
        role: 'student',
        OR: [{ email: { contains: adm } }],
      },
      include: { studentProfile: { select: { id: true, admissionNumber: true, isActive: true } } },
    });
    console.log(`Users with ${adm} in email:`, JSON.stringify(users, null, 2));
  }
}

main().finally(() => p.$disconnect());
