import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Fetch fee balances and payment history for a student
export async function GET(
  request: NextRequest, 
  { params }: { params: { schoolCode: string; studentId: string } }
) {
  try {
    const { schoolCode, studentId } = params;
    const decodedSchoolCode = decodeURIComponent(schoolCode);

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: decodedSchoolCode }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Find the student
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: school.id,
        isActive: true
      },
      include: {
        user: true,
        class: {
          include: {
            grade: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch student fee records
    const studentFees = await prisma.studentFee.findMany({
      where: {
        studentId: student.id
      },
      include: {
        feeStructure: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch payment history
    const payments = await prisma.payment.findMany({
      where: {
        studentId: student.id
      },
      include: {
        receipt: true
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });

    // Calculate total outstanding balance from receipts
    const totalOutstanding = payments.reduce((sum, payment) => {
      return sum + (payment.receipt?.balance || 0);
    }, 0);

    // Get current term fee structures for the student's grade
    const currentYear = new Date().getFullYear();
    const currentTermStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class?.gradeId,
        year: currentYear,
        isActive: true
      },
      orderBy: {
        term: 'asc'
      }
    });

    // Map fee structures to payment history for better display
    const feeSummary = currentTermStructures.map(structure => {
      // Find payments for this term
      const termPayments = payments.filter(payment => 
        payment.description?.includes(structure.term) || 
        payment.description?.includes(structure.year.toString())
      );
      
      const totalPaid = termPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalAmount = parseFloat(structure.totalAmount.toString());
      const balance = Math.max(0, totalAmount - totalPaid);
      
      return {
        term: structure.term,
        year: structure.year,
        totalAmount: totalAmount,
        breakdown: structure.breakdown,
        dueDate: structure.dueDate,
        totalPaid: totalPaid,
        balance: balance,
        status: balance === 0 ? 'paid' : balance < totalAmount ? 'partial' : 'pending',
        payments: termPayments
      };
    });

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.user.name,
        admissionNumber: student.admissionNumber,
        gradeName: student.class?.grade?.name || 'Not Assigned',
        className: student.class?.name || 'Not Assigned'
      },
      feeSummary,
      totalOutstanding,
      paymentHistory: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        description: payment.description,
        receiptNumber: payment.receiptNumber,
        referenceNumber: payment.referenceNumber
      }))
    });

  } catch (error) {
    console.error('Error fetching student fees:', error);
    return NextResponse.json({ error: 'Failed to fetch student fees' }, { status: 500 });
  }
} 