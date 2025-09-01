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

    // 1. Calculate opening arrears (before join date/term)
    // Use the most recent studentArrear record before the join year as the opening balance.
    // If none exists (e.g., new student), fallback to sum all arrears for the student.
    let arrearsBroughtForward = 0;
    if (joinAcademicYearId) {
      const lastArrear = await prisma.studentArrear.findFirst({
        where: {
          studentId: student.id,
          academicYearId: { lt: joinAcademicYearId }
        },
        orderBy: { academicYearId: 'desc' }
      });
      if (lastArrear) {
        arrearsBroughtForward = lastArrear.arrearAmount || 0;
      } else {
        // Fallback: sum all arrears if no record before join year (e.g., new student)
        const allArrears = await prisma.studentArrear.aggregate({
          where: { studentId: student.id },
          _sum: { arrearAmount: true }
        });
        arrearsBroughtForward = allArrears._sum.arrearAmount || 0;
      }
    }

    // Build transactions: charges (debit), payments (credit)
    let transactions: any[] = [];
    // Insert opening balance if needed
    if (arrearsBroughtForward !== 0) {
      transactions.push({
        ref: '',
        description: 'Opening Balance (Brought Forward)',
        debit: arrearsBroughtForward > 0 ? arrearsBroughtForward : 0,
        credit: arrearsBroughtForward < 0 ? Math.abs(arrearsBroughtForward) : 0,
        date: joinDate || new Date(),
        type: 'opening-balance',
        termId: null,
        academicYearId: null,
        termName: '',
        academicYearName: '',
        balance: arrearsBroughtForward
      });
    }
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

    // Group transactions by term for better balance tracking
    const termGroups = new Map();
    
    // Group transactions by term
    transactions.forEach(txn => {
      const termKey = `${txn.academicYearId || 'no-year'}-${txn.termId || 'no-term'}`;
      if (!termGroups.has(termKey)) {
        termGroups.set(termKey, {
          termId: txn.termId,
          termName: txn.termName,
          academicYearId: txn.academicYearId,
          academicYearName: txn.academicYearName,
          transactions: []
        });
      }
      termGroups.get(termKey).transactions.push(txn);
    });

    // Process transactions with improved balance tracking and carry-forward logic
    let academicYearRunningBalance = arrearsBroughtForward;
    let carryForwardToNextTerm = 0; // Track overpayments/outstanding to carry forward
    const allRows: any[] = [];
    let rowNumber = 1;

    // Add arrears brought forward if any
    if (arrearsBroughtForward !== 0) {
      allRows.push({
        no: rowNumber++,
        ref: 'B/F',
        description: 'BALANCE BROUGHT FORWARD',
        debit: arrearsBroughtForward > 0 ? arrearsBroughtForward : 0,
        credit: arrearsBroughtForward < 0 ? Math.abs(arrearsBroughtForward) : 0,
        date: new Date(new Date().getFullYear(), 0, 1), // Start of academic year
        type: 'brought-forward',
        academicYearBalance: arrearsBroughtForward,
        termBalance: 0,
        termName: 'Previous Terms',
        academicYearName: 'Brought Forward'
      });
    }

    // Sort term groups by academic year and term order
    const termOrder: Record<string, number> = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
    const sortedTermGroups = Array.from(termGroups.values()).sort((a, b) => {
      // First sort by academic year
      if (a.academicYearName !== b.academicYearName) {
        return (a.academicYearName || '').localeCompare(b.academicYearName || '');
      }
      // Then sort by term order
      return (termOrder[a.termName || ''] || 0) - (termOrder[b.termName || ''] || 0);
    });

    // Process each term group with carry-forward logic
    sortedTermGroups.forEach((termGroup, index) => {
      let termRunningBalance = 0;
      
      // Apply carry-forward from previous term
      if (carryForwardToNextTerm !== 0) {
        const isOverpayment = carryForwardToNextTerm < 0;
        const carryForwardDescription = isOverpayment 
          ? `OVERPAYMENT FROM PREVIOUS TERM (REDUCES CURRENT TERM CHARGES)`
          : `OUTSTANDING BALANCE CARRIED FORWARD FROM PREVIOUS TERM`;
        
        allRows.push({
          no: rowNumber++,
          ref: 'C/F',
          description: carryForwardDescription,
          debit: carryForwardToNextTerm > 0 ? carryForwardToNextTerm : 0,
          credit: carryForwardToNextTerm < 0 ? Math.abs(carryForwardToNextTerm) : 0,
          date: termGroup.transactions[0]?.date || new Date(),
          type: 'carry-forward',
          termId: termGroup.termId,
          termName: termGroup.termName,
          academicYearId: termGroup.academicYearId,
          academicYearName: termGroup.academicYearName,
          academicYearBalance: academicYearRunningBalance,
          termBalance: carryForwardToNextTerm
        });
        
        // Apply carry-forward to term balance
        termRunningBalance = carryForwardToNextTerm;
      }
      
      // Add term header
      if (termGroup.termName && termGroup.termName !== 'no-term') {
        allRows.push({
          no: '',
          ref: '',
          description: `=== ${termGroup.termName.toUpperCase()} ${termGroup.academicYearName} ===`,
          debit: '',
          credit: '',
          date: termGroup.transactions[0]?.date,
          type: 'term-header',
          termId: termGroup.termId,
          termName: termGroup.termName,
          academicYearId: termGroup.academicYearId,
          academicYearName: termGroup.academicYearName,
          academicYearBalance: academicYearRunningBalance,
          termBalance: termRunningBalance
        });
      }

      // Process transactions within the term
      termGroup.transactions.forEach(txn => {
        const debitAmount = txn.debit || 0;
        const creditAmount = txn.credit || 0;
        
        // Update balances
        termRunningBalance += debitAmount - creditAmount;
        academicYearRunningBalance += debitAmount - creditAmount;

        allRows.push({
          no: rowNumber++,
          ref: txn.ref,
          description: txn.description,
          debit: debitAmount,
          credit: creditAmount,
          date: txn.date,
          type: txn.type,
          termId: txn.termId,
          termName: txn.termName,
          academicYearId: txn.academicYearId,
          academicYearName: txn.academicYearName,
          academicYearBalance: academicYearRunningBalance,
          termBalance: termRunningBalance
        });
      });

      // Add term closing balance if there were transactions
      if (termGroup.transactions.length > 0 && termGroup.termName && termGroup.termName !== 'no-term') {
        // For term closing, show the effective balance (0 if overpaid, actual balance if outstanding)
        const effectiveTermBalance = termRunningBalance > 0 ? termRunningBalance : 0;
        
        allRows.push({
          no: '',
          ref: '',
          description: `TERM ${termGroup.termName.toUpperCase()} BALANCE`,
          debit: effectiveTermBalance > 0 ? effectiveTermBalance : 0,
          credit: effectiveTermBalance < 0 ? Math.abs(effectiveTermBalance) : 0,
          date: termGroup.transactions[termGroup.transactions.length - 1]?.date,
          type: 'term-closing',
          termId: termGroup.termId,
          termName: termGroup.termName,
          academicYearId: termGroup.academicYearId,
          academicYearName: termGroup.academicYearName,
          academicYearBalance: academicYearRunningBalance,
          termBalance: effectiveTermBalance,
          isClosingBalance: true
        });
      }

      // Calculate carry-forward for next term
      // If this is not the last term, carry forward the balance
      if (index < sortedTermGroups.length - 1) {
        carryForwardToNextTerm = termRunningBalance;
      } else {
        // Last term - no carry forward to next term
        carryForwardToNextTerm = 0;
      }
    });

    // Calculate summary
    const totalDebit = allRows.reduce((sum, row) => sum + (parseFloat(row.debit) || 0), 0);
    const totalCredit = allRows.reduce((sum, row) => sum + (parseFloat(row.credit) || 0), 0);
    const finalAcademicYearBalance = allRows.length > 0 ? (allRows[allRows.length - 1].academicYearBalance || 0) : arrearsBroughtForward;

    // Get academic year name
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: targetAcademicYearId || '' },
      select: { name: true }
    });

    // Get student details
    const studentDetails = await prisma.student.findFirst({
      where: { id: studentId, schoolId: school.id },
      include: {
        user: { select: { name: true } },
        class: {
          include: {
            grade: { select: { name: true } }
          }
        },
        parent: { select: { name: true } }
      }
    });

    // Calculate term-specific balances from processed data
    const termBalances = new Map();
    
    allRows.forEach(row => {
      if (row.termName && row.termName !== 'Previous Terms' && row.type !== 'term-header' && row.type !== 'term-closing') {
        const termKey = `${row.termName}-${row.academicYearName}`;
        if (!termBalances.has(termKey)) {
          termBalances.set(termKey, {
            termName: row.termName,
            academicYearName: row.academicYearName,
            charges: 0,
            payments: 0,
            balance: 0,
            termId: row.termId,
            academicYearId: row.academicYearId
          });
        }
        
        const termData = termBalances.get(termKey);
        if (row.type === 'invoice') {
          termData.charges += (row.debit || 0);
        } else if (row.type === 'payment') {
          termData.payments += (row.credit || 0);
        }
        termData.balance = termData.charges - termData.payments;
      }
    });

    // Return structured data with term-specific balances
    return NextResponse.json({
      student: {
        name: studentDetails?.user?.name || 'Student',
        admissionNumber: studentDetails?.admissionNumber || 'N/A',
        gradeName: studentDetails?.class?.grade?.name || 'N/A',
        className: studentDetails?.class?.name || 'N/A',
        parentName: studentDetails?.parent?.name || undefined
      },
      academicYear: academicYear?.name || 'Academic Year',
      statement: allRows,
      termBalances: Array.from(termBalances.values()),
      summary: {
        totalDebit,
        totalCredit,
        finalAcademicYearBalance,
        finalBalance: finalAcademicYearBalance, // For backward compatibility
        totalPayments: totalCredit,
        totalCharges: totalDebit,
        arrearsBroughtForward
      }
    });
  } catch (error) {
    console.error('Error generating fee statement:', error);
    return NextResponse.json({ error: 'Failed to generate fee statement' }, { status: 500 });
  }
} 