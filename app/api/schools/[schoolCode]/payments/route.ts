import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { jsonError, requireRole, requireSchoolAccess } from "@/lib/api-guard";
import { computeStudentFeesSnapshot } from "@/lib/services/student-fees-snapshot";

// POST: Process a new payment
export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();
    const { session, schoolContext } = await requireSchoolAccess(schoolCode);
    requireRole(session, ["super_admin", "school_admin", "bursar", "parent", "student"]);

    const body = await request.json();
    
    console.log('Payment API called with:', { schoolCode, body });
    
    const {
      studentId,
      amount,
      paymentMethod,
      feeType,
      academicYear, // Now expecting name instead of ID
      term,         // Now expecting name instead of ID
      description,
      referenceNumber,
      receivedBy,
      phoneNumber
    } = body;

    // Validate required fields
    if (!studentId || !amount || !paymentMethod || !academicYear || !term) {
      return NextResponse.json({ 
        error: 'Missing required fields: studentId, amount, paymentMethod, academicYear, term' 
      }, { status: 400 });
    }

    const schoolRecord = await prisma.school.findUnique({
      where: { id: schoolContext.schoolId },
    });
    if (!schoolRecord) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    const schoolName = schoolRecord?.name ?? "School";

    // Fetch the student
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: schoolContext.schoolId,
        isActive: true
      },
      include: {
        user: true,
        class: true,
      }
    });
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Find or create academic year and term based on names
    let academicYearRecord = await prisma.academicYear.findFirst({
      where: {
        schoolId: schoolContext.schoolId,
        name: academicYear
      }
    });

    if (!academicYearRecord) {
      // Create academic year if it doesn't exist
      const year = parseInt(academicYear);
      if (isNaN(year)) {
        return NextResponse.json({ error: 'Invalid academic year format' }, { status: 400 });
      }
      
      academicYearRecord = await prisma.academicYear.create({
        data: {
          schoolId: schoolContext.schoolId,
          name: academicYear,
          startDate: new Date(year, 0, 1), // January 1st of the year
          endDate: new Date(year, 11, 31), // December 31st of the year
          isCurrent: false
        }
      });
    }

    let termRecord = await prisma.term.findFirst({
      where: {
        academicYearId: academicYearRecord.id,
        name: term
      }
    });

    // Add check: If termRecord is not found, return error
    if (!termRecord) {
      console.error('Payment API: Term not found for academic year', { term, academicYear: academicYearRecord.name });
      return NextResponse.json({ error: `Term '${term}' not found for academic year '${academicYearRecord.name}'. Please contact admin.` }, { status: 400 });
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Generate reference number if not provided
    const finalReferenceNumber = referenceNumber || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Align payment balances to the same carry-forward engine used by parent/bursar views.
    const snapshotBefore = await computeStudentFeesSnapshot(
      prisma as any,
      schoolRecord as any,
      student as any,
      academicYearRecord.id,
      { persistYearEndCarryForward: false }
    );
    const safeBefore = "error" in snapshotBefore ? null : snapshotBefore;
    const termRowBefore = safeBefore?.termBalances.find((t) => t.termId === termRecord.id);
    const academicYearOutstandingBefore = safeBefore?.academicYearOutstanding ?? 0;
    const termOutstandingBefore = termRowBefore?.balance ?? 0;
    // --- Apply the payment ---
    // (We just record the payment; the /fees endpoint will recalculate balances in real time)
    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        studentId,
        amount,
        paymentDate: new Date(),
        paymentMethod: paymentMethod === 'mpesa' ? 'mobile_money' : paymentMethod,
        referenceNumber: finalReferenceNumber,
        receiptNumber,
        description: description || `${feeType} - ${term} ${academicYear}`,
        receivedBy: receivedBy || 'Parent Portal',
        academicYearId: academicYearRecord.id,
        termId: termRecord.id,
      }
    });
    // Recompute after payment and persist end-of-year carry-forward for next year balances.
    const snapshotAfter = await computeStudentFeesSnapshot(
      prisma as any,
      schoolRecord as any,
      student as any,
      academicYearRecord.id,
      { persistYearEndCarryForward: true }
    );
    const safeAfter = "error" in snapshotAfter ? null : snapshotAfter;
    const termRowAfter = safeAfter?.termBalances.find((t) => t.termId === payment.termId);
    const academicYearOutstandingAfter = safeAfter?.academicYearOutstanding ?? Math.max(0, academicYearOutstandingBefore - Number(payment.amount));
    const termOutstandingAfter = termRowAfter?.balance ?? Math.max(0, termOutstandingBefore - Number(payment.amount));
    const carryForward = Math.max(0, Number(payment.amount) - Math.max(0, termOutstandingBefore));
    // --- Create receipt with correct balances and term/year ---
    const receipt = await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        studentId: student.id,
        receiptNumber: payment.receiptNumber,
        amount: amount,
        paymentDate: new Date(),
        academicYearOutstandingBefore,
        academicYearOutstandingAfter,
        termOutstandingBefore,
        termOutstandingAfter,
        carryForward,
        academicYearId: payment.academicYearId,
        termId: payment.termId,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
      }
    });

    let emailNotificationSent = false;
    // Send email notification if parent email exists
    try {
      const { EmailService } = await import('@/lib/services/email-service');
      const emailService = new EmailService();
      emailNotificationSent = await emailService.sendPaymentNotificationForPayment(
        payment.id,
        schoolCode
      );
      console.log('Email notification status for payment:', payment.id, emailNotificationSent);
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the payment if email fails
    }

    return NextResponse.json({
      message: 'Payment processed successfully',
      payment: {
        ...payment,
        studentId: student.id,
        studentName: student.user.name,
        className: student.class?.name,
        admissionNumber: student.admissionNumber,
        term,
        academicYear,
        referenceNumber: payment.referenceNumber,
        receiptNumber: payment.receiptNumber,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        description: payment.description,
        schoolName,
        academicYearOutstandingBefore,
        academicYearOutstandingAfter,
        termOutstandingBefore,
        termOutstandingAfter,
        carryForward,
        emailNotificationSent,
      },
      receipt,
      emailNotificationSent,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error processing payment:', error);
    console.error('Error stack:', error.stack);
    return jsonError(error);
  }
}

// GET: Fetch payments for a student
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ["super_admin", "school_admin", "bursar", "parent", "student"]);

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const schoolName =
      (await prisma.school.findUnique({
        where: { id: schoolContext.schoolId },
        select: { name: true },
      }))?.name ?? "School";

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: schoolContext.schoolId, isActive: true },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const payments = await prisma.payment.findMany({
      where: { studentId },
      include: {
        student: { include: { user: true, class: true } },
        receipt: true,
        academicYear: true,
        term: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    return NextResponse.json(payments.map(payment => ({
      ...payment,
      studentId: payment.student?.id,
      studentName: payment.student?.user?.name,
      className: payment.student?.class?.name,
      admissionNumber: payment.student?.admissionNumber,
      term: payment.term?.name || payment.description?.match(/Term \d/)?.[0],
      academicYear: payment.academicYear?.name || payment.description?.match(/\d{4}/)?.[0],
      referenceNumber: payment.referenceNumber,
      receiptNumber: payment.receiptNumber,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      description: payment.description,
      schoolName,
      balanceBeforeAcademicYear: payment.receipt?.academicYearOutstandingBefore ?? null,
      balanceAfterAcademicYear: payment.receipt?.academicYearOutstandingAfter ?? null,
      termOutstandingBefore: payment.receipt?.termOutstandingBefore ?? null,
      termOutstandingAfter: payment.receipt?.termOutstandingAfter ?? null,
    })));
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Failed to fetch payments:", errorMessage);
    return jsonError(error);
  }
}
