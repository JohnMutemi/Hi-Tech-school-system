const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Default passwords
const DEFAULT_PASSWORDS = {
  student: 'student123',
  teacher: 'teacher123',
  parent: 'parent123',
  admin: 'school123',
  bursar: 'bursar123',
};

async function hashDefaultPasswordByRole(role) {
  const password = DEFAULT_PASSWORDS[role.toLowerCase()];
  if (!password) {
    throw new Error(`Unknown role: ${role}`);
  }
  return await bcrypt.hash(password, 12);
}

async function updateExistingPasswords() {
  console.log('Starting password update for existing users...\n');

  try {
    // Update all students
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      include: { studentProfile: true }
    });

    console.log(`Found ${students.length} students to update`);

    for (const student of students) {
      const hashedPassword = await hashDefaultPasswordByRole('student');
      await prisma.user.update({
        where: { id: student.id },
        data: { password: hashedPassword }
      });
      console.log(`Updated student: ${student.name} (${student.email})`);
    }

    // Update all teachers
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      include: { teacherProfile: true }
    });

    console.log(`Found ${teachers.length} teachers to update`);

    for (const teacher of teachers) {
      const hashedPassword = await hashDefaultPasswordByRole('teacher');
      await prisma.user.update({
        where: { id: teacher.id },
        data: { password: hashedPassword }
      });
      console.log(`Updated teacher: ${teacher.name} (${teacher.email})`);
    }

    // Update all parents
    const parents = await prisma.user.findMany({
      where: { role: 'parent' }
    });

    console.log(`Found ${parents.length} parents to update`);

    for (const parent of parents) {
      const hashedPassword = await hashDefaultPasswordByRole('parent');
      await prisma.user.update({
        where: { id: parent.id },
        data: { password: hashedPassword }
      });
      console.log(`Updated parent: ${parent.name} (${parent.phone})`);
    }

    console.log('\n✅ Password update completed successfully!');
    console.log('\nAll users can now log in with their default passwords:');
    console.log('- Students: student123');
    console.log('- Teachers: teacher123');
    console.log('- Parents: parent123');

  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingPasswords(); 