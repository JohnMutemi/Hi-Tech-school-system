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
    const gradeId = searchParams.get('gradeId');
    const classId = searchParams.get('classId');
    const academicYear = searchParams.get('academicYear') || new Date().getFullYear().toString();
    const term = searchParams.get('term') || 'Term 1';

    // Find the school by code
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Build where clause for filtering
    let whereClause: any = {
      schoolId: school.id,
    };

    if (gradeId) {
      whereClause.class = {
        gradeId: gradeId,
      };
    }

    if (classId) {
      whereClause.classId = classId;
    }

    // Fetch students with their related data
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        class: {
          include: {
            grade: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        // Get recent payment for each student
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
          take: 1,
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: [
        { class: { grade: { name: 'asc' } } },
        { class: { name: 'asc' } },
        { user: { name: 'asc' } },
      ],
    });

    // Calculate real-time balances for each student using the fee balance service
    const studentsWithBalances = await Promise.all(
      students.map(async (student) => {
        try {
          // Use the fee balance service to get real-time balance
          const balanceData = await feeBalanceService.calculateStudentBalance(
            student.id,
            academicYear,
            term
          );

          return {
            id: student.id,
            name: student.user.name,
            admissionNumber: student.admissionNumber,
            email: student.user.email,
            phone: student.user.phone,
            gradeName: student.class?.grade?.name || 'N/A',
            className: student.class?.name || 'N/A',
            academicYear: parseInt(academicYear),
            parent: student.parent ? {
              id: student.parent.id,
              name: student.parent.name,
              email: student.parent.email,
              phone: student.parent.phone,
            } : null,
            class: student.class ? {
              id: student.class.id,
              name: student.class.name,
              grade: {
                id: student.class.grade.id,
                name: student.class.grade.name,
              },
            } : null,
            feeStructure: balanceData.feeStructure ? {
              id: balanceData.feeStructure.id,
              name: balanceData.feeStructure.name || `${student.class?.grade?.name} Fee Structure`,
              totalAmount: balanceData.totalRequired,
              breakdown: balanceData.feeBreakdown,
            } : null,
            totalFeeRequired: balanceData.totalRequired,
            totalPaid: balanceData.totalPaid,
            balance: balanceData.balance,
            lastPayment: student.payments.length > 0 ? {
              id: student.payments[0].id,
              amount: student.payments[0].amount,
              paymentDate: student.payments[0].paymentDate.toISOString(),
              paymentMethod: student.payments[0].paymentMethod,
            } : null,
          };
        } catch (error) {
          console.error(`Error calculating balance for student ${student.id}:`, error);
          // Return student with zero balance if calculation fails
          return {
            id: student.id,
            name: student.user.name,
            admissionNumber: student.admissionNumber,
            email: student.user.email,
            phone: student.user.phone,
            gradeName: student.class?.grade?.name || 'N/A',
            className: student.class?.name || 'N/A',
            academicYear: parseInt(academicYear),
            parent: student.parent ? {
              id: student.parent.id,
              name: student.parent.name,
              email: student.parent.email,
              phone: student.parent.phone,
            } : null,
            class: student.class ? {
              id: student.class.id,
              name: student.class.name,
              grade: {
                id: student.class.grade.id,
                name: student.class.grade.name,
              },
            } : null,
            feeStructure: null,
            totalFeeRequired: 0,
            totalPaid: 0,
            balance: 0,
            lastPayment: student.payments.length > 0 ? {
              id: student.payments[0].id,
              amount: student.payments[0].amount,
              paymentDate: student.payments[0].paymentDate.toISOString(),
              paymentMethod: student.payments[0].paymentMethod,
            } : null,
          };
        }
      })
    );

    // Calculate summary statistics
    const summary = {
      totalStudents: studentsWithBalances.length,
      totalOutstanding: studentsWithBalances.reduce((sum, student) => sum + student.balance, 0),
      studentsWithBalance: studentsWithBalances.filter(student => student.balance > 0).length,
      fullyPaid: studentsWithBalances.filter(student => student.balance <= 0).length,
    };

    return NextResponse.json({
      success: true,
      students: studentsWithBalances,
      summary,
      academicYear,
      term,
    });
  } catch (error) {
    console.error('Error fetching students with fee balances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


