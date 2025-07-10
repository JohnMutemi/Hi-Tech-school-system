const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get the latest receipt
  const latestReceipt = await prisma.receipt.findFirst({
    orderBy: { paymentDate: 'desc' },
  });
  if (!latestReceipt) {
    console.log('No receipts found.');
    return;
  }
  console.log('Latest Receipt:');
  console.log({
    id: latestReceipt.id,
    receiptNumber: latestReceipt.receiptNumber,
    amount: latestReceipt.amount,
    balance: latestReceipt.balance,
    balanceBefore: latestReceipt.balanceBefore,
    paymentDate: latestReceipt.paymentDate,
    studentId: latestReceipt.studentId,
  });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 