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

    const school = await prisma.school.findUnique({ where: { code: decodedSchoolCode } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: school.id, isActive: true },
      include: { user: true, class: { include: { grade: true } } }
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentAdmissionYear = student.dateAdmitted ? new Date(student.dateAdmitted).getFullYear() : new Date().getFullYear();

    const allPayments = await prisma.payment.findMany({
      where: { studentId: student.id },
      orderBy: [{ academicYear: 'asc' }, { paymentDate: 'asc' }],
    });

    const allTermStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class?.gradeId,
        isActive: true,
      },
      orderBy: [{ year: 'asc' }, { term: 'asc' }],
    });
    
    const paymentsByYear = allPayments.reduce((acc, p) => {
      const year = p.academicYear;
      if (!acc[year]) acc[year] = [];
      acc[year].push(p);
      return acc;
    }, {} as Record<number, typeof allPayments>);

    const structuresByYear = allTermStructures.reduce((acc, s) => {
      const year = s.year;
      if (!acc[year]) acc[year] = [];
      acc[year].push(s);
      return acc;
    }, {} as Record<number, typeof allTermStructures>);

    const feesByYear: any = {};
    let carryForward = 0;
    const sortedYears = [...new Set([...Object.keys(structuresByYear).map(Number), ...Object.keys(paymentsByYear).map(Number)])].sort();

    for (const year of sortedYears) {
      if (year < studentAdmissionYear) continue;

      const yearStructures = structuresByYear[year] || [];
      const yearPayments = paymentsByYear[year] || [];
      
      const yearTotalDue = yearStructures.reduce((sum, s) => sum + parseFloat(s.totalAmount.toString()), 0);
      const totalDueWithCarryForward = yearTotalDue + carryForward;
      
      const yearTotalPaid = yearPayments.filter(p => p.paymentMethod !== 'CARRY_FORWARD').reduce((sum, p) => sum + p.amount, 0);

      let yearBalance = totalDueWithCarryForward - yearTotalPaid;

      // Distribute this year's payments across its terms
      let remainingPaidForYear = yearTotalPaid;
      const terms = yearStructures.map(structure => {
          const termTotalAmount = parseFloat(structure.totalAmount.toString());
          const paidForTerm = Math.min(remainingPaidForYear, termTotalAmount);
          remainingPaidForYear -= paidForTerm;
          const termBalance = termTotalAmount - paidForTerm;
          
          return {
              term: structure.term,
              year: structure.year,
              totalAmount: termTotalAmount,
              totalPaid: paidForTerm,
              balance: termBalance,
              status: termBalance <= 0 ? 'paid' : (paidForTerm > 0 ? 'partial' : 'pending'),
              payments: yearPayments.filter(p => p.term === structure.term),
              breakdown: structure.breakdown,
              dueDate: structure.dueDate,
          };
      });

      feesByYear[year] = {
        terms,
        yearTotal: yearTotalDue,
        yearPaid: yearTotalPaid,
        yearBalance: yearBalance,
        carryForwardIn: carryForward,
      };
      
      // The new carry-forward for next year is this year's balance
      carryForward = yearBalance > 0 ? yearBalance : 0;
    }
    
    const finalBalance = carryForward; // The final carry-forward is the total outstanding

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.user.name,
        admissionNumber: student.admissionNumber,
        gradeName: student.class?.grade?.name || 'Not Assigned',
        className: student.class?.name || 'Not Assigned'
      },
      feesByYear,
      totalOutstanding: finalBalance,
      paymentHistory: allPayments,
    });

  } catch (error: any) {
    console.error('Error fetching student fees:', error);
    return NextResponse.json({ error: 'Failed to fetch student fees' }, { status: 500 });
  }
}