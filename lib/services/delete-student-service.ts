import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Tx = Prisma.TransactionClient;

/** Hard-delete all rows tied to one student (fees, payments, grades, portal login). */
export async function deleteStudentRelatedRecords(
  tx: Tx,
  studentId: string
): Promise<void> {
  await tx.promotionExclusion.deleteMany({ where: { studentId } });
  await tx.promotionLog.deleteMany({ where: { studentId } });
  await tx.studentPromotionRequest.deleteMany({ where: { studentId } });
  await tx.studentArrear.deleteMany({ where: { studentId } });
  await tx.studentYearlyBalance.deleteMany({ where: { studentId } });
  await tx.studentFee.deleteMany({ where: { studentId } });
  await tx.receipt.deleteMany({ where: { studentId } });

  const paymentIds = await tx.payment.findMany({
    where: { studentId },
    select: { id: true },
  });
  if (paymentIds.length > 0) {
    await tx.paymentNotificationLog.deleteMany({
      where: { paymentId: { in: paymentIds.map((p) => p.id) } },
    });
  }

  await tx.payment.deleteMany({ where: { studentId } });
  await tx.paymentRequest.deleteMany({ where: { studentId } });
  await tx.feeStatement.deleteMany({ where: { studentId } });
  await tx.alumni.deleteMany({ where: { studentId } });
  await tx.studentScore.deleteMany({ where: { studentId } });
  await tx.studentGradeResult.deleteMany({ where: { studentId } });
}

/**
 * Permanently remove a student and their portal login user from the database.
 * Parent accounts are kept when other children still reference them.
 */
export async function deleteStudentCompletely(
  studentId: string,
  schoolId: string
): Promise<{ deleted: boolean; userId: string | null }> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    select: { id: true, userId: true, parentId: true },
  });

  if (!student) {
    return { deleted: false, userId: null };
  }

  const userId = student.userId;

  await prisma.$transaction(
    async (tx) => {
      await deleteStudentRelatedRecords(tx, studentId);
      await tx.student.delete({ where: { id: studentId } });
      await tx.user.delete({ where: { id: userId } });
    },
    { maxWait: 10_000, timeout: 60_000 }
  );

  return { deleted: true, userId };
}
