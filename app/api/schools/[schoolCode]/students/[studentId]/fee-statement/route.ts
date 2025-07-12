import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Professional fee statement for a student
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string; studentId: string } }) {
  try {
    const { schoolCode, studentId } = params;
    const decodedSchoolCode = decodeURIComponent(schoolCode);
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    // Find the school
    const school = await prisma.school.findUnique({ where: { code: decodedSchoolCode } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Find the student
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: school.id, isActive: true },
      select: {
        id: true,
        joinedAcademicYearId: true,
        joinedTermId: true,
        dateAdmitted: true,
        classId: true,
        class: {
          select: {
            id: true,
            name: true,
            gradeId: true,
            grade: { select: { id: true, name: true } }
          }
        }
      }
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

    // Get all termly fee structures (charges/invoices) for this student/grade
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

    console.log('DEBUG: Filtered fee structures found:', feeStructures.map(fs => ({
      id: fs.id,
      term: fs.term,
      year: fs.year,
      termId: fs.termId,
      academicYearId: fs.academicYearId,
      totalAmount: fs.totalAmount
    })));

    // Get all payments for this student (include academicYearId and termId)
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
        academicYear: {
          select: {
            name: true
          }
        },
        term: {
          select: {
            name: true
          }
        }
      }
    });

    // Get join reference point
    const joinAcademicYearId = student.joinedAcademicYearId;
    const joinTermId = student.joinedTermId;
    const joinDate = student.dateAdmitted ? new Date(student.dateAdmitted) : null;

    console.log('DEBUG: Student join info:', {
      joinAcademicYearId,
      joinTermId,
      joinDate,
      studentId: student.id,
      gradeId: student.class?.gradeId,
      targetAcademicYearId
    });

    // Filter fee structures to only include those on or after the join point
    let filteredFeeStructures = feeStructures;
    if (joinAcademicYearId && joinTermId) {
      // Find the join term's name
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

    console.log('DEBUG: Filtered fee structures after join logic:', filteredFeeStructures.map(fs => ({
      id: fs.id,
      term: fs.term,
      year: fs.year,
      termId: fs.termId,
      academicYearId: fs.academicYearId,
      totalAmount: fs.totalAmount
    })));

    // Filter payments to only include those on or after the join point
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

    // Build transactions: charges (debit), payments (credit)
    let transactions: any[] = [];
    // Charges (invoices)
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
    // Payments (credits)
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

    // Sort all transactions by date
    transactions = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance and insert TERM CLOSING BALANCE rows
    let runningBalance = 0;
    let lastTermKey = '';
    let termClosingRows: any[] = [];
    transactions = transactions.map((txn, idx) => {
      runningBalance += (txn.debit || 0) - (txn.credit || 0);
      const result = {
        ...txn,
        balance: runningBalance
      };
      // If this is the last transaction for a term, add a closing balance row
      const thisTermKey = `${txn.academicYearId || ''}-${txn.termId || ''}`;
      const nextTxn = transactions[idx + 1];
      const nextTermKey = nextTxn ? `${nextTxn.academicYearId || ''}-${nextTxn.termId || ''}` : '';
      if (thisTermKey && thisTermKey !== nextTermKey) {
        termClosingRows.push({
          ref: '',
          description: `TERM CLOSING BALANCE - ${txn.termName} ${txn.academicYearName}`,
          debit: '',
          credit: '',
          date: txn.date,
          type: 'term-closing',
          termId: txn.termId,
          academicYearId: txn.academicYearId,
          termName: txn.termName,
          academicYearName: txn.academicYearName,
          balance: runningBalance
        });
      }
      return result;
    });

    // Add row numbers
    transactions = transactions.map((txn, idx) => ({
      no: idx + 1,
      ...txn
    }));
    // Add term closing rows after all transactions
    const allRows = [...transactions, ...termClosingRows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(allRows);
  } catch (error) {
    console.error('Error generating fee statement:', error);
    return NextResponse.json({ error: 'Failed to generate fee statement' }, { status: 500 });
  }
} 