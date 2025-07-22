// Script: debug-student-promotion.js
// Debugs why 'to class not found' errors are happening for specific students

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Add the student IDs you want to debug here:
const studentIds = [
  '01e5c2ea-7a77-4e23-8520-3e282162be05',
  '19d65a91-ca22-49a2-9814-33e8b98a317e',
];

async function main() {
  for (const studentId of studentIds) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, user: true },
    });
    if (!student) {
      console.log(`Student ${studentId} not found.`);
      continue;
    }
    const className = student.class ? student.class.name : '(none)';
    console.log(`\nStudent: ${student.user ? student.user.name : studentId}`);
    console.log(`  Current class: ${className}`);
    if (!student.class) {
      console.log('  No class assigned.');
      continue;
    }
    // Find progression rule
    const progression = await prisma.classProgression.findFirst({
      where: { fromClass: className, isActive: true },
    });
    if (!progression) {
      console.log('  No progression rule for this class.');
      continue;
    }
    console.log(`  Progression rule: ${progression.fromClass} -> ${progression.toClass}`);
    // Check if toClass exists and is active
    const toClass = await prisma.class.findFirst({
      where: { name: progression.toClass, isActive: true },
    });
    if (toClass) {
      console.log(`  Target class exists and is active: ${toClass.name}`);
    } else {
      console.log(`  Target class NOT FOUND or not active: ${progression.toClass}`);
    }
  }
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 