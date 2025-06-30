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

    const currentYear = new Date().getFullYear();
    const studentAdmissionYear = student.dateAdmitted ? new Date(student.dateAdmitted).getFullYear() : currentYear;

    // Fetch ALL payments for the student
    const allPayments = await prisma.payment.findMany({
      where: { studentId: student.id },
      orderBy: { paymentDate: 'asc' },
    });

    // Fetch ALL applicable termly fee structures for the student's grade
    const allTermStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class?.gradeId,
        isActive: true,
      },
      orderBy: [{ year: 'asc' }, { term: 'asc' }],
    });

    let totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate arrears from previous years, considering student's admission date
    const previousYearsStructures = allTermStructures.filter(s => s.year < currentYear && s.year >= studentAdmissionYear);
    const previousYearsTotalDue = previousYearsStructures.reduce((sum, s) => sum + parseFloat(s.totalAmount.toString()), 0);
    
    let amountPaidTowardsPreviousYears = 0;
    if (previousYearsTotalDue > 0) {
        amountPaidTowardsPreviousYears = Math.min(totalPaid, previousYearsTotalDue);
    }
    const carryForwardArrears = previousYearsTotalDue - amountPaidTowardsPreviousYears;
    
    let remainingPaidPool = totalPaid - amountPaidTowardsPreviousYears;

    // Calculate breakdown of arrears by year
    const carryForwardBreakdown: { year: number; outstanding: number }[] = [];
    let tempPaidPool = allPayments.reduce((sum, p) => sum + p.amount, 0);

    const structuresByYear = previousYearsStructures.reduce((acc, s) => {
        if (!acc[s.year]) {
            acc[s.year] = [];
        }
        acc[s.year].push(s);
        return acc;
    }, {} as Record<number, typeof previousYearsStructures>);

    for (const yearStr of Object.keys(structuresByYear).sort()) {
        const year = parseInt(yearStr, 10);
        const yearDue = structuresByYear[year].reduce((sum, s) => sum + parseFloat(s.totalAmount.toString()), 0);
        const yearPaid = Math.min(tempPaidPool, yearDue);
        const yearBalance = yearDue - yearPaid;
        if (yearBalance > 0) {
            carryForwardBreakdown.push({ year, outstanding: yearBalance });
        }
        tempPaidPool -= yearPaid;
    }


    // Calculate current year's fee summary
    const currentYearStructures = allTermStructures.filter(s => s.year === currentYear);
    const feeSummary = currentYearStructures.map(structure => {
      const totalAmount = parseFloat(structure.totalAmount.toString());
      const paidForTerm = Math.min(remainingPaidPool, totalAmount);
      const balance = totalAmount - paidForTerm;
      
      remainingPaidPool -= paidForTerm; // Reduce the pool for the next term

      const termPayments = allPayments.filter(p => p.academicYear === structure.year && p.term === structure.term);

      return {
        term: structure.term,
        year: structure.year,
        totalAmount: totalAmount,
        totalPaid: totalAmount - balance,
        balance: balance,
        carryForward: 0, // This logic is now handled globally
        status: balance <= 0 ? 'paid' : (paidForTerm > 0 ? 'partial' : 'pending'),
        payments: termPayments, // Note: This shows payments made for this term specifically
        breakdown: structure.breakdown,
        dueDate: structure.dueDate,
      };
    });
    
    // If there is any remaining pool (overpayment), show it as a negative balance on the last term
    if (remainingPaidPool > 0 && feeSummary.length > 0) {
        const lastTerm = feeSummary[feeSummary.length - 1];
        lastTerm.balance -= remainingPaidPool;
        lastTerm.totalPaid += remainingPaidPool;
    }

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.user.name,
        admissionNumber: student.admissionNumber,
        gradeName: student.class?.grade?.name || 'Not Assigned',
        className: student.class?.name || 'Not Assigned'
      },
      feeSummary,
      carryForwardArrears,
      carryForwardBreakdown,
      paymentHistory: allPayments,
    });

  } catch (error) {
    console.error('Error fetching student fees:', error);
    return NextResponse.json({ error: 'Failed to fetch student fees' }, { status: 500 });
  }
} 