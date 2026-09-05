import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SMSService } from "@/lib/services/sms-service";
import { shouldSendParentFeePaymentSms } from "@/lib/fee-payment-sms";
import { EmailService } from "@/lib/services/email-service";
import { findTermBalanceRow } from "@/lib/fees/fee-structure-resolve";
import { computeStudentFeesSnapshot } from "@/lib/services/student-fees-snapshot";
import { jsonError, requireRole, requireSchoolAccess } from "@/lib/api-guard";

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const { session, schoolContext } = await requireSchoolAccess(schoolCode);
    requireRole(session, ["super_admin", "school_admin", "bursar"]);

    const body = await request.json();
    
    const {
      studentId,
      amount,
      paymentMethod,
      description,
      referenceNumber,
      paymentDate,
      receivedBy,
      sendSMS = false,
    } = body;

    // Validate required fields
    if (!studentId || !amount || !paymentMethod || !receivedBy) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, amount, paymentMethod, receivedBy" },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolContext.schoolId },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Find the student with parent information
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: school.id,
        isActive: true,
      },
      include: {
        user: true,
        parent: true,
        class: { include: { grade: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get current academic year and term
    const currentYear = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, isCurrent: true },
    });
    
    let currentTerm = null;
    if (currentYear) {
      currentTerm = await prisma.term.findFirst({
        where: { academicYearId: currentYear.id, isCurrent: true },
      });
    }

    if (!currentYear || !currentTerm) {
      return NextResponse.json(
        { error: "No current academic year or term found" },
        { status: 400 }
      );
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const paymentAmount = parseFloat(amount);

    // Same carry-forward engine as bursar PaymentHub (/payments)
    const snapshotBefore = await computeStudentFeesSnapshot(
      prisma as any,
      school as any,
      student as any,
      currentYear.id,
      { persistYearEndCarryForward: false }
    );
    const safeBefore = "error" in snapshotBefore ? null : snapshotBefore;
    const termRowBefore = findTermBalanceRow(safeBefore?.termBalances, {
      termId: currentTerm.id,
      termName: currentTerm.name,
    });
    const academicYearOutstandingBefore = safeBefore?.academicYearOutstanding ?? 0;
    const termOutstandingBefore = termRowBefore?.balance ?? 0;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: paymentAmount,
        paymentDate: new Date(paymentDate),
        paymentMethod: paymentMethod,
        referenceNumber: referenceNumber || null,
        receiptNumber: receiptNumber,
        description: description || "Manual Payment",
        receivedBy: receivedBy,
        academicYearId: currentYear.id,
        termId: currentTerm.id,
      },
    });

    const snapshotAfter = await computeStudentFeesSnapshot(
      prisma as any,
      school as any,
      student as any,
      currentYear.id,
      { persistYearEndCarryForward: true }
    );
    const safeAfter = "error" in snapshotAfter ? null : snapshotAfter;
    const termRowAfter = findTermBalanceRow(safeAfter?.termBalances, {
      termId: currentTerm.id,
      termName: currentTerm.name,
    });
    const academicYearOutstandingAfter =
      safeAfter?.academicYearOutstanding ??
      Math.max(0, academicYearOutstandingBefore - paymentAmount);
    const termOutstandingAfter =
      termRowAfter?.balance ?? Math.max(0, termOutstandingBefore - paymentAmount);

    // Create receipt
    const receipt = await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        studentId: student.id,
        receiptNumber: receiptNumber,
        amount: paymentAmount,
        paymentDate: new Date(paymentDate),
        academicYearOutstandingBefore,
        academicYearOutstandingAfter,
        termOutstandingBefore,
        termOutstandingAfter,
        academicYearId: currentYear.id,
        termId: currentTerm.id,
        paymentMethod: paymentMethod,
        referenceNumber: referenceNumber || null,
      },
    });

    // Send SMS only when staff requests it, school allows SMS, and guardian opted in.
    let smsResult = null;
    const smsPhone =
      student.parent?.phone?.trim() || student.parentPhone?.trim() || "";
    if (
      sendSMS &&
      smsPhone &&
      shouldSendParentFeePaymentSms(school, student)
    ) {
      try {
        smsResult = await SMSService.sendManualPaymentConfirmation(
          smsPhone,
          student.parent?.name || student.parentName || "Parent",
          student.user.name,
          parseFloat(amount),
          new Date(paymentDate),
          school.name,
          receiptNumber
        );
      } catch (smsError) {
        console.error("SMS sending failed:", smsError);
        // Don't fail the payment if SMS fails
      }
    }

    // Send email notification if parent email exists
    let emailResult = null;
    if (student.parentEmail) {
      try {
        const emailService = new EmailService();
        emailResult = await emailService.sendPaymentNotificationForPayment(
          payment.id,
          schoolCode
        );
        console.log("Email notification sent:", emailResult);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't fail the payment if email fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Manual payment recorded successfully",
      payment: {
        id: payment.id,
        amount: payment.amount,
        receiptNumber: payment.receiptNumber,
        referenceNumber: payment.referenceNumber,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        description: payment.description,
        receivedBy: payment.receivedBy,
      },
      receipt: {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        academicYearOutstandingBefore: receipt.academicYearOutstandingBefore,
        academicYearOutstandingAfter: receipt.academicYearOutstandingAfter,
        termOutstandingBefore: receipt.termOutstandingBefore,
        termOutstandingAfter: receipt.termOutstandingAfter,
      },
      sms: smsResult,
      email: emailResult,
      student: {
        name: student.user.name,
        admissionNumber: student.admissionNumber,
        parentName: student.parent?.name,
        parentPhone: student.parent?.phone,
        parentEmail: student.parentEmail,
      },
    });

  } catch (error) {
    console.error("Manual payment error:", error);
    return jsonError(error);
  }
}
