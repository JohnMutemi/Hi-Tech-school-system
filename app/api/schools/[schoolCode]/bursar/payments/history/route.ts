import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { feeBalanceService } from '@/lib/services/fee-balance-service';

const prisma = new PrismaClient();

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

    // Verify student belongs to the school
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: school.id,
      },
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

    // Get payment history using the fee balance service
    const paymentHistory = await feeBalanceService.getPaymentHistory(
      studentId,
      academicYear || undefined,
      term || undefined
    );

    // Get current balance
    const currentBalance = await feeBalanceService.calculateStudentBalance(
      studentId,
      academicYear || new Date().getFullYear().toString(),
      term || 'FIRST'
    );

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.user.name,
          admissionNumber: student.admissionNumber,
          className: student.class?.name,
          gradeName: student.class?.grade?.name,
        },
        currentBalance,
        paymentHistory,
        summary: {
          totalPayments: paymentHistory.length,
          totalAmountPaid: paymentHistory.reduce((sum, payment) => sum + payment.amount, 0),
          lastPaymentDate: paymentHistory[0]?.paymentDate || null,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

