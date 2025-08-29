import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { academicYearTransitionService } from '@/lib/services/academic-year-transition-service';

const prisma = new PrismaClient();

// GET: Fetch fee balances and payment history for a student
export async function GET(
  request: Request,
  { params }: { params: { schoolCode: string; studentId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearIdParam = searchParams.get('academicYearId');
    const academicYearNameParam = searchParams.get('academicYear'); // e.g. "2025"

    const prisma = new PrismaClient();

    // Get school
    const school = await prisma.school.findFirst({
      where: { code: params.schoolCode },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Get student with class and grade info
    const student = await prisma.student.findFirst({
      where: { id: params.studentId },
      include: {
        class: {
          include: {
            grade: true
          }
        },
        user: true
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    console.log('=== FEES DEBUG ===');
    console.log('Student:', {
      id: student.id,
      name: student.user?.name,
      classId: student.class?.id,
      className: student.class?.name,
      gradeId: student.class?.gradeId,
      gradeName: student.class?.grade?.name
    });

    // Use student's actual grade level
    const targetGradeId = student.class?.gradeId;
    const studentGradeName = student.class?.grade?.name;
    
    console.log(`Using student's grade level: ${studentGradeName} (ID: ${targetGradeId})`);

    if (!targetGradeId) {
      return NextResponse.json({ 
        error: 'Student is not assigned to a grade',
        student: {
          id: student.id,
          name: student.user?.name,
          admissionNumber: student.admissionNumber,
          gradeName: 'Not Assigned',
          className: student.class?.name || 'Not Assigned'
        }
      }, { status: 400 });
    }

    // Resolve target academic year (by id if provided, else by name if provided, else current)
    let targetAcademicYearId: string | null = academicYearIdParam;
    if (!targetAcademicYearId) {
      if (academicYearNameParam) {
        const ayByName = await prisma.academicYear.findFirst({
          where: { schoolId: school.id, name: academicYearNameParam },
        });
        targetAcademicYearId = ayByName?.id || null;
      } else {
        const currentYear = await prisma.academicYear.findFirst({
          where: { schoolId: school.id, isCurrent: true },
        });
        targetAcademicYearId = currentYear?.id || null;
      }
    }

    // Get fee structures for this student's grade and target academic year (using academicYearId)
    let feeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: targetGradeId,
        isActive: true,
        ...(targetAcademicYearId ? { academicYearId: targetAcademicYearId } : {}),
        NOT: [
          { termId: null },
          { academicYearId: null },
        ],
      },
      include: {
        grade: true,
        academicYear: { select: { name: true } },
      },
    });

    console.log(`=== FEE STRUCTURE FETCHING ===`);
    console.log(`Student Grade: ${studentGradeName} (ID: ${targetGradeId})`);
    console.log(`AcademicYearId filter: ${targetAcademicYearId || 'ALL'}`);
    console.log(`Found ${feeStructures.length} fee structures for this grade${targetAcademicYearId ? ` and academicYearId ${targetAcademicYearId}` : ''}`);
    
    // Show all fee structures found
    feeStructures.forEach((fs, index) => {
      console.log(`${index + 1}. ID: ${fs.id}`);
      console.log(`   Grade: ${fs.grade?.name}`);
      console.log(`   Term: ${fs.term}`);
      console.log(`   Amount: ${fs.totalAmount}`);
      console.log(`   Year: ${fs.year}`);
      console.log(`   AcademicYearId: ${fs.academicYearId}`);
      console.log('---');
    });

    // Remove duplicates by keeping only one fee structure per term
    const feeStructuresByTerm = new Map();
    
    console.log(`=== SELECTING ONE PER TERM ===`);
    for (const fs of feeStructures) {
      if (!feeStructuresByTerm.has(fs.term)) {
        feeStructuresByTerm.set(fs.term, fs);
        console.log(`✅ Selected for ${fs.term}: ID=${fs.id}, Amount=${fs.totalAmount}`);
      } else {
        console.log(`⏭️ Skipped duplicate for ${fs.term}: ID=${fs.id}, Amount=${fs.totalAmount}`);
      }
    }

    // Convert to array and sort by term order
    const termOrder: Record<string, number> = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
    const finalFeeStructures = Array.from(feeStructuresByTerm.values())
      .sort((a, b) => (termOrder[a.term] || 0) - (termOrder[b.term] || 0));

    console.log(`=== FINAL SELECTION ===`);
    console.log(`Final fee structures: ${finalFeeStructures.length} structures`);
    finalFeeStructures.forEach((fs, index) => {
      console.log(`${index + 1}. ${fs.term}: Amount ${fs.totalAmount}, ID ${fs.id}, Grade ${fs.grade?.name}`);
    });

    // Use the fee structures found
    let filteredFeeStructures = finalFeeStructures;
    console.log(`Using ${filteredFeeStructures.length} fee structures for current academic year`);

    // Debug: Check ALL fee structures for this grade (without filters)
    const allFeeStructuresForGrade = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class?.gradeId,
        isActive: true
      }
    });
    
    console.log('=== ALL FEE STRUCTURES FOR GRADE ===');
    console.log('Grade ID:', student.class?.gradeId);
    console.log('Total fee structures for this grade:', allFeeStructuresForGrade.length);
    console.log('All fee structures:', allFeeStructuresForGrade.map(fs => ({
      id: fs.id,
      gradeId: fs.gradeId,
      term: fs.term,
      year: fs.year,
      academicYearId: fs.academicYearId,
      termId: fs.termId,
      totalAmount: fs.totalAmount,
      isActive: fs.isActive
    })));

    // Debug: Check academic years and terms
    const academicYears = await prisma.academicYear.findMany({
      where: { schoolId: school.id }
    });
    console.log('Academic Years:', academicYears.map(ay => ({
      id: ay.id,
      name: ay.name,
      isCurrent: ay.isCurrent
    })));

    const terms = await prisma.term.findMany({
      where: { academicYearId: { in: academicYears.map(ay => ay.id) } }
    });
    console.log('Terms:', terms.map(t => ({
      id: t.id,
      name: t.name,
      academicYearId: t.academicYearId,
      isCurrent: t.isCurrent
    })));

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
        referenceNumber: true,
        receiptNumber: true,
        description: true,
        receivedBy: true,
        academicYearId: true,
        termId: true,
        academicYear: { select: { name: true } },
        term: { select: { name: true } },
        receipt: true,
      }
    });

    const joinAcademicYearId = student.joinedAcademicYearId;
    const joinTermId = student.joinedTermId;
    const joinDate = student.dateAdmitted ? new Date(student.dateAdmitted) : null;

    // filteredFeeStructures = filteredFeeStructures.filter(fs => {
    //   if (!fs.academicYearId || !fs.term) return false;
    //   if (joinAcademicYearId && fs.academicYearId < joinAcademicYearId) return false;
    //   if (joinAcademicYearId && fs.academicYearId === joinAcademicYearId && joinTermId) {
    //     const termOrder: Record<string, number> = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
    //     return termOrder[fs.term] >= termOrder[joinTermId];
    //   }
    //   return true;
    // });
    // BYPASS FILTER FOR DEBUGGING
    // Now all fee structures for the grade/year/term will be included

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
        date: fs.createdAt, // Use createdAt for invoice date
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

    console.log('=== PROCESSING TERM BALANCES ===');
    console.log(`Processing ${filteredFeeStructures.length} fee structures:`);
    filteredFeeStructures.forEach((fs: any, index) => {
      console.log(`Fee structure ${index + 1}: ID=${fs.id}, Term=${fs.term}, Amount=${fs.totalAmount}, AcademicYearId=${fs.academicYearId}, TermId=${fs.termId}`);
    });

    // Check for carry forward from previous academic year
    let carryForward = 0;
    if (filteredFeeStructures.length > 0) {
      const firstTerm = filteredFeeStructures[0];
      const academicYearNumber = parseInt(firstTerm.year);
      
      // Get previous year's closing balance
      try {
        const previousYearBalance = await prisma.studentYearlyBalance.findUnique({
          where: {
            studentId_academicYear: {
              studentId: student.id,
              academicYear: academicYearNumber - 1
            }
          }
        });
        
        if (previousYearBalance && previousYearBalance.closingBalance > 0) {
          carryForward = previousYearBalance.closingBalance;
          console.log(`Academic year carry forward from ${academicYearNumber - 1}: KES ${carryForward}`);
        }
      } catch (error) {
        console.log('No previous year balance found, starting with zero carry forward');
      }
    }
    
    const termBalances = [];
    let academicYearCarryForward = null;
    
    for (let index = 0; index < filteredFeeStructures.length; index++) {
      const fs = filteredFeeStructures[index];
      const charges = transactions
        .filter(txn => txn.termId === fs.termId && txn.academicYearId === fs.academicYearId && txn.type === 'invoice')
        .reduce((sum, txn) => sum + (txn.debit || 0), 0);

      const paymentsForTerm = transactions
        .filter(txn => txn.termId === fs.termId && txn.academicYearId === fs.academicYearId && txn.type === 'payment')
        .reduce((sum, txn) => sum + (txn.credit || 0), 0);

      // Debug logging for payment matching
      const termPayments = transactions.filter(txn => txn.termId === fs.termId && txn.academicYearId === fs.academicYearId && txn.type === 'payment');
      console.log(`Term ${fs.term} (${fs.termId}): Found ${termPayments.length} payments totaling KES ${paymentsForTerm}`);
      termPayments.forEach(payment => {
        console.log(`  Payment: ${payment.ref}, Amount: ${payment.credit}, TermId: ${payment.termId}, AcademicYearId: ${payment.academicYearId}`);
      });

      // Calculate base balance for this term
      let baseBalance = charges - paymentsForTerm;
      
      // Apply carry forward from previous terms
      let balance = baseBalance + carryForward;
      let carryToNext = 0;
      
      // Normal carry-forward logic for all terms
      if (balance < 0) {
        carryToNext = balance; // This will be negative (overpayment)
        balance = 0;
      }
      
      // Calculate effective paid amount (includes carry-forward effects)
      let effectivePaidAmount = paymentsForTerm;
      if (carryForward < 0) {
        // If we received carry-forward (overpayment from previous terms), add it to paid amount
        effectivePaidAmount = paymentsForTerm + Math.abs(carryForward);
      }
      
      console.log(`Term ${fs.term}: Charges=${charges}, Payments=${paymentsForTerm}, BaseBalance=${baseBalance}, CarryForward=${carryForward}, FinalBalance=${balance}, CarryToNext=${carryToNext}, EffectivePaid=${effectivePaidAmount}`);
      
      const isLastTerm = index === filteredFeeStructures.length - 1;

      const result = {
        termId: fs.termId,
        academicYearId: fs.academicYearId,
        term: fs.term,
        year: fs.year,
        totalAmount: fs.totalAmount,
        balance: Math.max(0, balance), // Ensure balance is never negative
        baseBalance: baseBalance,
        carryForward: carryForward,
        carryToNext: carryToNext,
        paidAmount: effectivePaidAmount, // Add effective paid amount
        academicYearOutstanding: academicYearOutstanding // Add for reference
      };
      
      // Update carry forward for next term (unless it's the last term)
      if (!isLastTerm) {
        carryForward = carryToNext;
      } else {
        // This is the last term of the academic year
        // Handle end-of-year carry forward
        if (carryToNext !== 0) {
          const academicYearNumber = parseInt(fs.year);
          academicYearCarryForward = {
            studentId: student.id,
            nextAcademicYear: academicYearNumber + 1,
            carryForwardAmount: carryToNext
          };
          console.log(`End-of-year carry forward to ${academicYearNumber + 1}: KES ${carryToNext}`);
        }
      }
      
      termBalances.push(result);
    }
    
    // Handle year-end carry forward after the loop
    if (academicYearCarryForward) {
      try {
        await academicYearTransitionService.handleYearEndCarryForward(
          academicYearCarryForward.studentId,
          academicYearCarryForward.nextAcademicYear,
          academicYearCarryForward.carryForwardAmount
        );
      } catch (error) {
        console.error('Error handling year-end carry forward:', error);
      }
    }

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
          name: student.user?.name,
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
        paymentMethod: payment.receipt?.paymentMethod,
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
    