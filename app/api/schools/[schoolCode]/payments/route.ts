import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// POST: Process a new payment
export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();
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

    // Fetch the school first
    const school = await prisma.school.findUnique({ where: { code: schoolCode } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }
    const schoolName = school.name;

    // Fetch the student
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: school.id,
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
        schoolId: school.id,
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
          schoolId: school.id,
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

    if (!termRecord) {
      // Create term if it doesn't exist
      termRecord = await prisma.term.create({
        data: {
          academicYearId: academicYearRecord.id,
          name: term,
          startDate: new Date(),
          endDate: new Date(),
          isCurrent: false
        }
      });
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Generate reference number if not provided
    const finalReferenceNumber = referenceNumber || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

    // Calculate outstanding balances (simplified)
    const academicYearOutstandingBefore = 0; // You can implement proper calculation here
    const termOutstandingBefore = 0; // You can implement proper calculation here
    const academicYearOutstandingAfter = academicYearOutstandingBefore - Number(amount);
    const termOutstandingAfter = termOutstandingBefore - Number(amount);

    // Create receipt
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
        academicYearId: payment.academicYearId,
        termId: payment.termId,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
      }
    });

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
      },
      receipt,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error processing payment:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}

// GET: Fetch payments for a student
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const school = await prisma.school.findUnique({ where: { code: params.schoolCode } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }
    const schoolName = school.name;

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
    return NextResponse.json({ error: 'Failed to fetch payments', details: errorMessage }, { status: 500 });
  }
}
