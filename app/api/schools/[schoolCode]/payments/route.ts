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
      term,
      academicYear,
      phoneNumber,
      transactionId,
      referenceNumber,
      description,
      academicYearOutstandingBefore,
      termOutstandingBefore
    } = body;

    // Validate required fields
    if (!studentId || !amount || !paymentMethod || !feeType || !term || !academicYear) {
      console.log('Missing required fields:', { studentId, amount, paymentMethod, feeType, term, academicYear });
      return NextResponse.json(
        { error: 'Missing required fields: studentId, amount, paymentMethod, feeType, term, academicYear' },
        { status: 400 }
      );
    }

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    });

    if (!school) {
      console.log('School not found:', schoolCode);
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const schoolName = school.name;

    console.log('School found:', school.id);

    // Find the student
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: school.id,
        isActive: true
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            gradeId: true,
            grade: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        currentAcademicYearId: true,
        currentTermId: true,
        joinedAcademicYearId: true,
        joinedTermId: true,
        admissionNumber: true
      }
    });

    if (!student) {
      console.log('Student not found:', { studentId, schoolId: school.id });
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    console.log('Student found:', { 
      studentId: student.id, 
      studentName: student.user.name,
      gradeId: student.class?.gradeId,
      gradeName: student.class?.grade?.name
    });

    // Step 1: Check for outstanding arrears
    let remainingAmount = parseFloat(amount);
    let arrearsCleared = false;
    let arrearRecord = await prisma.studentArrear.findFirst({
      where: {
        studentId: student.id,
        schoolId: school.id,
        arrearAmount: { gt: 0 }
      },
      orderBy: { dateRecorded: 'asc' }
    });
    if (arrearRecord) {
      if (remainingAmount >= arrearRecord.arrearAmount) {
        // Payment covers all arrears
        remainingAmount -= arrearRecord.arrearAmount;
        await prisma.studentArrear.update({
          where: { id: arrearRecord.id },
          data: { arrearAmount: 0 }
        });
        arrearsCleared = true;
      } else {
        // Payment only partially covers arrears
        await prisma.studentArrear.update({
          where: { id: arrearRecord.id },
          data: { arrearAmount: arrearRecord.arrearAmount - remainingAmount }
        });
        // All payment used for arrears, do not proceed to term fee
        return NextResponse.json({
          success: true,
          message: 'Payment applied to arrears only',
          arrearsRemaining: arrearRecord.arrearAmount - remainingAmount
        }, { status: 201 });
      }
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    console.log('Creating payment record...');

    // Find the current academic year and term for the student
    const currentAcademicYearId = student.currentAcademicYearId || student.joinedAcademicYearId;
    const currentTermId = student.currentTermId || student.joinedTermId;

    // Use remainingAmount for payment creation and receipt logic
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: remainingAmount,
        paymentDate: new Date(),
        paymentMethod: paymentMethod === 'mpesa' ? 'mobile_money' : paymentMethod,
        referenceNumber: referenceNumber || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        receiptNumber,
        description: description || `${feeType} - ${term} ${academicYear}` + (arrearsCleared ? ' (Arrears Cleared)' : ''),
        receivedBy: 'Parent Portal', // In a real system, this would be the logged-in user
        academicYearId: currentAcademicYearId,
        termId: currentTermId,
      }
    });

    console.log('Payment created:', payment.id);

    console.log('Creating receipt record...');

    // --- Use provided balances for receipt ---
    const academicYearOutstandingAfter = (academicYearOutstandingBefore ?? 0) - Number(remainingAmount);
    const termOutstandingAfter = (termOutstandingBefore ?? 0) - Number(remainingAmount);

    // Create receipt with new fields
    const receipt = await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        studentId: student.id,
        receiptNumber,
        amount: remainingAmount,
        paymentDate: new Date(),
        academicYearOutstandingBefore: academicYearOutstandingBefore ?? 0,
        academicYearOutstandingAfter,
        termOutstandingBefore: termOutstandingBefore ?? 0,
        termOutstandingAfter,
        academicYearId: payment.academicYearId,
        termId: payment.termId,
      }
    });

    console.log('Receipt created:', receipt.id);

    // Return payment and receipt info
    return NextResponse.json({
      success: true,
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
    const schoolCode = params.schoolCode.toLowerCase();
    const { searchParams } = new URL(request.url);
    
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const schoolName = school.name;

    // Fetch payments for the student
    const payments = await prisma.payment.findMany({
      where: {
        studentId,
        student: {
          schoolId: school.id
        }
      },
      include: {
        receipt: true,
        student: {
          include: {
            user: true,
            class: {
              include: {
                grade: true
              }
            }
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });

    // Return payments with actual outstanding balances from receipt
    return NextResponse.json(payments.map(payment => ({
      ...payment,
      studentId: payment.student?.id,
      studentName: payment.student?.user?.name,
      className: payment.student?.class?.name,
      admissionNumber: payment.student?.admissionNumber,
      term: payment.description?.match(/Term \d/)?[0] : undefined,
      academicYear: payment.description?.match(/\d{4}/)?[0] : undefined,
      referenceNumber: payment.referenceNumber,
      receiptNumber: payment.receiptNumber,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      description: payment.description,
      schoolName,
      // Add these fields from the receipt record if available
      balanceBeforeAcademicYear: payment.receipt?.academicYearOutstandingBefore ?? null,
      balanceAfterAcademicYear: payment.receipt?.academicYearOutstandingAfter ?? null,
      termOutstandingBefore: payment.receipt?.termOutstandingBefore ?? null,
      termOutstandingAfter: payment.receipt?.termOutstandingAfter ?? null,
    })));

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
} 