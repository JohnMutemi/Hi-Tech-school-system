import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete all receipts first (because of foreign key constraint)
  await prisma.receipt.deleteMany({});
  // Delete all payments
  await prisma.payment.deleteMany({});
  console.log('All payments and receipts have been deleted.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 