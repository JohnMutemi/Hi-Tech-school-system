import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@hitechsms.co.ke' },
    update: {},
    create: {
      name: 'Platform Super Admin',
      email: 'admin@hitechsms.co.ke',
      password: hashedPassword,
      role: 'super_admin',
      schoolId: null,
    },
  });
  console.log('Seeded platform-level super admin.');

  // Seed global grades (Grade 1 to Grade 6)
  for (let i = 1; i <= 6; i++) {
    const gradeName = `Grade ${i}`;
    let grade = await prisma.grade.findFirst({ where: { name: gradeName } });
    if (!grade) {
      grade = await prisma.grade.create({ data: { name: gradeName } });
      console.log(`Created grade: ${gradeName}`);
    } else {
      console.log(`Grade already exists: ${gradeName}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 