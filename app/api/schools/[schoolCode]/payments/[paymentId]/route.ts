import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireRole, requireSchoolAccess } from "@/lib/api-guard";
import { computeStudentFeesSnapshot } from "@/lib/services/student-fees-snapshot";
import {
  applyPaymentCorrection,
  PaymentCorrectionError,
} from "@/lib/services/payment-correction-service";
import { PAYMENT_UNDO_WINDOW_MS } from "@/lib/payment-undo";

const CORRECTION_ROLES = ["super_admin", "school_admin", "bursar"] as const;

/** Bursar/finance staff may reverse a mistaken payment shortly after recording. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { schoolCode: string; paymentId: string } }
) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();
    const { session, schoolContext } = await requireSchoolAccess(schoolCode);
    requireRole(session, ["super_admin", "school_admin", "bursar"]);

    const payment = await prisma.payment.findFirst({
      where: {
        id: params.paymentId,
        student: { schoolId: schoolContext.schoolId, isActive: true },
      },
      include: {
        receipt: true,
        student: {
          include: {
            user: true,
            class: { include: { grade: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const recordedAt = payment.paymentDate.getTime();
    if (Date.now() - recordedAt > PAYMENT_UNDO_WINDOW_MS) {
      return NextResponse.json(
        { error: "Undo window has expired. This payment can no longer be reverted automatically." },
        { status: 403 }
      );
    }

    const schoolRecord = await prisma.school.findUnique({
      where: { id: schoolContext.schoolId },
    });
    if (!schoolRecord) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentNotificationLog.deleteMany({ where: { paymentId: payment.id } });
      await tx.receipt.deleteMany({ where: { paymentId: payment.id } });
      await tx.payment.delete({ where: { id: payment.id } });
    });

    await computeStudentFeesSnapshot(
      prisma as any,
      schoolRecord as any,
      payment.student as any,
      payment.academicYearId,
      { persistYearEndCarryForward: true }
    );

    return NextResponse.json({ message: "Payment reverted", id: params.paymentId });
  } catch (error) {
    return jsonError(error);
  }
}

/** Correct the latest payment after the undo window (amount, reference, term) with audit reason. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { schoolCode: string; paymentId: string } }
) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();
    const { session, schoolContext } = await requireSchoolAccess(schoolCode);
    requireRole(session, [...CORRECTION_ROLES]);

    const body = await request.json();
    const schoolRecord = await prisma.school.findUnique({
      where: { id: schoolContext.schoolId },
    });
    if (!schoolRecord) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const result = await applyPaymentCorrection(prisma, schoolRecord, {
      paymentId: params.paymentId,
      schoolId: schoolContext.schoolId,
      amount: body.amount,
      referenceNumber: body.referenceNumber,
      termName: body.term,
      reason: body.reason,
      correctedById: session.id,
      correctedByName: session.name ?? null,
    });

    return NextResponse.json({
      message: "Payment updated",
      payment: {
        id: result.payment.id,
        amount: result.payment.amount,
        referenceNumber: result.payment.referenceNumber,
        term: result.payment.term.name,
        academicYear: result.payment.academicYear.name,
        description: result.payment.description,
        ...result.balances,
      },
      correction: result.correction,
    });
  } catch (error) {
    if (error instanceof PaymentCorrectionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return jsonError(error);
  }
}
