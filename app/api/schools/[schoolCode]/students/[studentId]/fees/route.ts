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
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

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

    // Get current academic year if not specified
    let targetAcademicYearId = academicYearId || null;
    if (!targetAcademicYearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { schoolId: school.id, isCurrent: true },
      });
      targetAcademicYearId = currentYear?.id || null;
    }

    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class?.gradeId,
        isActive: true,
        NOT: [
          { termId: null },
          { academicYearId: null }
        ],
        ...(targetAcademicYearId ? { academicYearId: targetAcademicYearId } : {})
      }
    });

    const payments = await prisma.payment.findMany({
      where: { 
        studentId: student.id,
        ...(targetAcademicYearId ? { academicYearId: targetAcademicYearId } : {})
      },
      orderBy: { paymentDate: 'asc' },
      select: {
        id: true,
        studentId: true,
        amount: true,
        createdAt: true,
        paymentDate: true,
        paymentMethod: true,
        referenceNumber: true,
        receiptNumber: true,
        description: true,
        receivedBy: true,
        academicYearId: true,
        termId: true,
        academicYear: { select: { name: true } },
        term: { select: { name: true } }
      }
    });

    const joinAcademicYearId = student.joinedAcademicYearId;
    const joinTermId = student.joinedTermId;
    const joinDate = student.dateAdmitted ? new Date(student.dateAdmitted) : null;

    let filteredFeeStructures = feeStructures;
    if (joinAcademicYearId && joinTermId) {
      const joinTermObj = feeStructures.find(t => t.termId === joinTermId);
      const joinTermName = joinTermObj?.term;
      const termOrder: Record<string, number> = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };

      filteredFeeStructures = filteredFeeStructures.filter(fs => {
        if (!fs.academicYearId || !fs.term) return false;
        if (fs.academicYearId < joinAcademicYearId) return false;
        if (fs.academicYearId === joinAcademicYearId && joinTermName) {
          return termOrder[fs.term] >= termOrder[joinTermName];
        }
        return true;
      });
    } else if (joinDate) {
      filteredFeeStructures = filteredFeeStructures.filter(fs => {
        return fs.createdAt && new Date(fs.createdAt) >= joinDate;
      });
    }

    let filteredPayments = payments;
    if (joinAcademicYearId && joinTermId) {
      filteredPayments = filteredPayments.filter(p => {
        if (!p.academicYearId || !p.termId) return false;
        if (p.academicYearId < joinAcademicYearId) return false;
        if (p.academicYearId === joinAcademicYearId && p.termId < joinTermId) return false;
        return true;
      });
    } else if (joinDate) {
      filteredPayments = filteredPayments.filter(p => {
        return p.paymentDate && new Date(p.paymentDate) >= joinDate;
      });
    }

    let transactions: any[] = [];

    for (const fs of filteredFeeStructures) {
      transactions.push({
        ref: fs.id,
        description: `INVOICE - ${fs.term || ''} ${fs.year || ''}`,
        debit: Number(fs.totalAmount),
        credit: 0,
        date: fs.createdAt,
        type: 'invoice',
        termId: fs.termId,
        academicYearId: fs.academicYearId,
        termName: fs.term || '',
        academicYearName: fs.year ? fs.year.toString() : ''
      });
    }

    for (const p of filteredPayments) {
      transactions.push({
        ref: p.receiptNumber || p.referenceNumber || p.id,
        description: p.description || 'PAYMENT',
        debit: 0,
        credit: Number(p.amount),
        date: p.paymentDate,
        type: 'payment',
        termId: p.termId,
        academicYearId: p.academicYearId,
        termName: p.term?.name || '',
        academicYearName: p.academicYear?.name || ''
      });
    }

    transactions = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    transactions = transactions.map((txn) => {
      runningBalance += (txn.debit || 0) - (txn.credit || 0);
      return {
        ...txn,
        balance: runningBalance
      };
    });

    const academicYearOutstanding = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;

    let carryForward = 0;
    const termBalances = filteredFeeStructures.map((fs) => {
      const charges = transactions
        .filter(txn => txn.termId === fs.termId && txn.academicYearId === fs.academicYearId && txn.type === 'invoice')
        .reduce((sum, txn) => sum + (txn.debit || 0), 0);

      const paymentsForTerm = transactions
        .filter(txn => txn.termId === fs.termId && txn.academicYearId === fs.academicYearId && txn.type === 'payment')
        .reduce((sum, txn) => sum + (txn.credit || 0), 0);

      let balance = charges - paymentsForTerm + carryForward;
      let carryToNext = 0;
      if (balance < 0) {
        carryToNext = balance;
        balance = 0;
      }
      const result = {
        termId: fs.termId,
        academicYearId: fs.academicYearId,
        term: fs.term,
        year: fs.year,
        totalAmount: fs.totalAmount,
        balance
      };
      carryForward = carryToNext;
      return result;
    });

    let arrearsRecords = await prisma.studentArrear.findMany({
      where: {
        studentId: student.id,
        schoolId: school.id,
        // Remove arrearAmount: { gt: 0 } to include all arrears (positive, zero, negative)
        ...(joinAcademicYearId ? { academicYearId: { gte: joinAcademicYearId } } : {}),
        // Do not filter by targetAcademicYearId, sum all arrears
      }
    });

    const arrears = arrearsRecords.reduce((sum, record) => sum + record.arrearAmount, 0);
    const outstanding = academicYearOutstanding + arrears;

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.user.name,
        admissionNumber: student.admissionNumber,
        gradeName: student.class?.grade?.name || 'Not Assigned',
        className: student.class?.name || 'Not Assigned'
      },
      termBalances,
      academicYearOutstanding,
      outstanding,
      arrears,
      carryForwardArrears: 0,
      carryForwardBreakdown: [],
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

  } catch (error: any) {
    console.error('Error fetching student fees:', error);
    return NextResponse.json({ error: 'Failed to fetch student fees' }, { status: 500 });
  }
}
    