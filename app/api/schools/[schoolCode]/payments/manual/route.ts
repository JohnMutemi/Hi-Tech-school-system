import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { SMSService } from "@/lib/services/sms-service";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const body = await request.json();
    
    const {
      studentId,
      amount,
      paymentMethod,
      description,
      referenceNumber,
      paymentDate,
      receivedBy,
      sendSMS = true,
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

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
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
        class: true,
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

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: parseFloat(amount),
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

    // Calculate balances before and after payment
    const balancesBefore = await calculateBalances(student.id, currentYear.id, currentTerm.id);
    
    // Create receipt
    const receipt = await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        studentId: student.id,
        receiptNumber: receiptNumber,
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        academicYearOutstandingBefore: balancesBefore.academicYearOutstanding,
        academicYearOutstandingAfter: Math.max(0, balancesBefore.academicYearOutstanding - parseFloat(amount)),
        termOutstandingBefore: balancesBefore.termOutstanding,
        termOutstandingAfter: Math.max(0, balancesBefore.termOutstanding - parseFloat(amount)),
        academicYearId: currentYear.id,
        termId: currentTerm.id,
        paymentMethod: paymentMethod,
        referenceNumber: referenceNumber || null,
      },
    });

    // Send SMS notification if requested and parent phone exists
    let smsResult = null;
    if (sendSMS && student.parent?.phone) {
      try {
        smsResult = await SMSService.sendManualPaymentConfirmation(
          student.parent.phone,
          student.parent.name,
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
      student: {
        name: student.user.name,
        admissionNumber: student.admissionNumber,
        parentName: student.parent?.name,
        parentPhone: student.parent?.phone,
      },
    });

  } catch (error) {
    console.error("Manual payment error:", error);
    return NextResponse.json(
      { error: "Failed to record manual payment" },
      { status: 500 }
    );
  }
}

// Helper function to calculate balances
async function calculateBalances(studentId: string, academicYearId: string, termId: string) {
  try {
    // Get all termly fee structures for this student/grade for the academic year
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true }
    });

    if (!student?.class?.gradeId) {
      return { academicYearOutstanding: 0, termOutstanding: 0 };
    }

    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class.gradeId,
        isActive: true,
        academicYearId,
        NOT: [{ termId: null }]
      }
    });

    const payments = await prisma.payment.findMany({
      where: { 
        studentId,
        academicYearId
      },
      orderBy: { paymentDate: 'asc' }
    });

    // Calculate total charges and payments
    const totalCharges = feeStructures.reduce((sum, fs) => sum + Number(fs.totalAmount), 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const academicYearOutstanding = Math.max(0, totalCharges - totalPayments);

    // Calculate term-specific outstanding
    const termCharges = feeStructures
      .filter(fs => fs.termId === termId)
      .reduce((sum, fs) => sum + Number(fs.totalAmount), 0);
    
    const termPayments = payments
      .filter(p => p.termId === termId)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const termOutstanding = Math.max(0, termCharges - termPayments);

    return {
      academicYearOutstanding,
      termOutstanding
    };
  } catch (error) {
    console.error("Balance calculation error:", error);
    return { academicYearOutstanding: 0, termOutstanding: 0 };
  }
} 