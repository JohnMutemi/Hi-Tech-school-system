import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { feeBalanceService } from '@/lib/services/fee-balance-service';

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
      academicYear,
      term,
      paymentMethod = 'cash',
      receivedBy,
      description,
      referenceNumber,
    } = body;

    // Validate required fields
    if (!studentId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Student ID and valid amount are required' },
        { status: 400 }
      );
    }

    if (!receivedBy) {
      return NextResponse.json(
        { error: 'Bursar/receiver name is required' },
        { status: 400 }
      );
    }

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Find the student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        class: {
          include: {
            grade: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const currentYear = new Date().getFullYear().toString();
    const targetAcademicYear = academicYear || currentYear;
    const targetTerm = term || 'FIRST';

    try {
      // Use the fee balance service to record the payment
      const result = await feeBalanceService.recordPayment(
        student.id,
        amount,
        targetAcademicYear,
        targetTerm,
        paymentMethod,
        receivedBy,
        description,
        referenceNumber
      );

      // Return complete payment information
      return NextResponse.json({
        success: true,
        data: {
          payment: {
            id: result.payment.id,
            amount: result.payment.amount,
            paymentDate: result.payment.paymentDate,
            paymentMethod: result.payment.paymentMethod,
            referenceNumber: result.payment.referenceNumber,
            receiptNumber: result.payment.receiptNumber,
            description: result.payment.description,
            receivedBy: result.payment.receivedBy,
          },
          receipt: {
            id: result.receipt.id,
            receiptNumber: result.receipt.receiptNumber,
            amount: result.receipt.amount,
            paymentDate: result.receipt.paymentDate,
            balanceBefore: result.receipt.academicYearOutstandingBefore,
            balanceAfter: result.receipt.academicYearOutstandingAfter,
          },
          student: {
            id: student.id,
            name: student.user.name,
            admissionNumber: student.admissionNumber,
            className: student.class?.name,
            gradeName: student.class?.grade?.name,
          },
          feeStructure: {
            totalRequired: result.updatedBalance.totalRequired,
            breakdown: result.updatedBalance.feeBreakdown,
            totalPaid: result.updatedBalance.totalPaid,
            balance: result.updatedBalance.balance,
          },
          academicYear: targetAcademicYear,
          term: targetTerm,
          updatedBalance: result.updatedBalance,
        },
      });
    } catch (serviceError) {
      console.error('Fee balance service error:', serviceError);
      return NextResponse.json(
        { error: serviceError instanceof Error ? serviceError.message : 'Payment processing failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing cash payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch payment history for a student
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const academicYear = searchParams.get('academicYear');
    const term = searchParams.get('term');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Build query filters
    const whereClause: any = {
      studentId: studentId,
      student: {
        schoolId: school.id,
      },
    };

    if (academicYear) {
      whereClause.academicYear = {
        name: academicYear,
      };
    }

    if (term) {
      whereClause.term = {
        name: term,
      };
    }

    // Fetch payment history
    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        academicYear: {
          select: {
            name: true,
          },
        },
        term: {
          select: {
            name: true,
          },
        },
        receipt: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
