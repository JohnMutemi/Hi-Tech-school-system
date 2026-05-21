const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const adm = process.argv[2] || '1254';
  const school = await p.school.findFirst({
    where: { code: { equals: 'waitaprogressiveacademy', mode: 'insensitive' } },
  });
  if (!school) return;

  const student = await p.student.findFirst({
    where: { schoolId: school.id, admissionNumber: adm },
    include: {
      user: { select: { name: true } },
      class: { include: { grade: true } },
      payments: {
        include: { academicYear: true, term: true },
        orderBy: { paymentDate: 'desc' },
      },
      currentAcademicYear: true,
      currentTerm: true,
    },
  });
  if (!student) {
    console.log('not found');
    return;
  }

  console.log('Student:', student.user.name);
  console.log('currentAcademicYear:', student.currentAcademicYear?.name, student.currentAcademicYearId);
  console.log('currentTerm:', student.currentTerm?.name, student.currentTermId);
  console.log('joined:', student.joinedAcademicYearId, student.joinedTermId);

  const years = await p.academicYear.findMany({
    where: { schoolId: school.id },
    select: { id: true, name: true, isCurrent: true },
    orderBy: { name: 'desc' },
  });
  console.log('\nAcademic years:', years);

  console.log('\nPayments:');
  for (const pay of student.payments) {
    console.log(
      `  ${pay.amount} on ${pay.paymentDate.toISOString().slice(0, 10)} | year: ${pay.academicYear?.name} (${pay.academicYearId}) | term: ${pay.term?.name}`
    );
  }

  for (const year of years) {
    const fees = await p.termlyFeeStructure.findMany({
      where: {
        schoolId: school.id,
        gradeId: student.class?.gradeId,
        academicYearId: year.id,
        isActive: true,
      },
      select: { term: true, totalAmount: true, feeAccommodation: true },
    });
    console.log(`\nFee structures for year ${year.name} (current=${year.isCurrent}):`, fees.length);
    fees.forEach((f) => console.log(`  ${f.term} ${f.feeAccommodation || 'all'} = ${f.totalAmount}`));
  }
}

main().finally(() => p.$disconnect());
