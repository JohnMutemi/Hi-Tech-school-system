import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// POST: Process a new payment
export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();
    const body = await request.json();
    
    console.log('Payment API called with:', { schoolCode, body });
    
    const {
      studentId,
      amount,
      paymentMethod,
      feeType,
      academicYear, // Now expecting name instead of ID
      term,         // Now expecting name instead of ID
      description,
      referenceNumber,
      receivedBy,
      phoneNumber
    } = body;

    // Validate required fields
    if (!studentId || !amount || !paymentMethod || !academicYear || !term) {
      return NextResponse.json({ 
        error: 'Missing required fields: studentId, amount, paymentMethod, academicYear, term' 
      }, { status: 400 });
    }

    // Fetch the school first
    const school = await prisma.school.findUnique({ where: { code: schoolCode } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }
    const schoolName = school.name;

    // Fetch the student
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: school.id,
        isActive: true
      },
      include: {
        user: true,
        class: true,
      }
    });
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Find or create academic year and term based on names
    let academicYearRecord = await prisma.academicYear.findFirst({
      where: {
        schoolId: school.id,
        name: academicYear
      }
    });

    if (!academicYearRecord) {
      // Create academic year if it doesn't exist
      const year = parseInt(academicYear);
      if (isNaN(year)) {
        return NextResponse.json({ error: 'Invalid academic year format' }, { status: 400 });
      }
      
      academicYearRecord = await prisma.academicYear.create({
        data: {
          schoolId: school.id,
          name: academicYear,
          startDate: new Date(year, 0, 1), // January 1st of the year
          endDate: new Date(year, 11, 31), // December 31st of the year
          isCurrent: false
        }
      });
    }

    let termRecord = await prisma.term.findFirst({
      where: {
        academicYearId: academicYearRecord.id,
        name: term
      }
    });

    // Add check: If termRecord is not found, return error
    if (!termRecord) {
      console.error('Payment API: Term not found for academic year', { term, academicYear: academicYearRecord.name });
      return NextResponse.json({ error: `Term '${term}' not found for academic year '${academicYearRecord.name}'. Please contact admin.` }, { status: 400 });
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Generate reference number if not provided
    const finalReferenceNumber = referenceNumber || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // --- NEW LOGIC: Fetch current balances before payment ---
    // Get all termly fee structures for this student/grade for the academic year
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class?.gradeId,
        isActive: true,
        academicYearId: academicYearRecord.id,
        NOT: [ { termId: null } ]
      }
    });
    // Get all payments for this student for the academic year
    const payments = await prisma.payment.findMany({
      where: {
        studentId: student.id,
        academicYearId: academicYearRecord.id
      },
      orderBy: { paymentDate: 'asc' }
    });
    // Build transactions: charges (debit), payments (credit)
    let transactions = [];
    for (const fs of feeStructures) {
      transactions.push({
        ref: fs.id,
        description: `INVOICE - ${fs.term || ''} ${fs.year || ''}`,
        debit: Number(fs.totalAmount),
        credit: 0,
        date: fs.createdAt,
        type: 'invoice',
        termId: fs.termId,
        academicYearId: fs.academicYearId,
        term: fs.term,
        year: fs.year
      });
    }
    for (const p of payments) {
      transactions.push({
        ref: p.receiptNumber || p.referenceNumber || p.id,
        description: p.description || 'PAYMENT',
        debit: 0,
        credit: Number(p.amount),
        date: p.paymentDate,
        type: 'payment',
        termId: p.termId,
        academicYearId: p.academicYearId,
        term: undefined,
        year: undefined
      });
    }
    transactions = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Calculate running balance
    let runningBalance = 0;
    transactions = transactions.map((txn) => {
      runningBalance += (txn.debit || 0) - (txn.credit || 0);
      return {
        ...txn,
        balance: runningBalance
      };
    });
    const academicYearOutstandingBefore = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
    // --- Find the term fee structure for the payment ---
    const targetTermFee = feeStructures.find(fs => fs.term === term);
    // Calculate term balance before
    let termOutstandingBefore = 0;
    if (targetTermFee) {
      const charges = transactions.filter(txn => txn.termId === targetTermFee.termId && txn.type === 'invoice').reduce((sum, txn) => sum + (txn.debit || 0), 0);
      const paymentsForTerm = transactions.filter(txn => txn.termId === targetTermFee.termId && txn.type === 'payment').reduce((sum, txn) => sum + (txn.credit || 0), 0);
      termOutstandingBefore = charges - paymentsForTerm;
    }
    // --- Apply the payment ---
    // (We just record the payment; the /fees endpoint will recalculate balances in real time)
    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        studentId,
        amount,
        paymentDate: new Date(),
        paymentMethod: paymentMethod === 'mpesa' ? 'mobile_money' : paymentMethod,
        referenceNumber: finalReferenceNumber,
        receiptNumber,
        description: description || `${feeType} - ${term} ${academicYear}`,
        receivedBy: receivedBy || 'Parent Portal',
        academicYearId: academicYearRecord.id,
        termId: termRecord.id,
      }
    });
    // --- Recalculate balances after payment ---
    // Add this payment to the transactions and recalc
    transactions.push({
      ref: payment.receiptNumber || payment.referenceNumber || payment.id,
      description: payment.description || 'PAYMENT',
      debit: 0,
      credit: Number(payment.amount),
      date: payment.paymentDate,
      type: 'payment',
      termId: payment.termId,
      academicYearId: payment.academicYearId,
      term: term,
      year: academicYear,
      balance: 0 // will be recalculated below
    });
    transactions = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    runningBalance = 0;
    transactions = transactions.map((txn) => {
      runningBalance += (txn.debit || 0) - (txn.credit || 0);
      return {
        ...txn,
        balance: runningBalance
      };
    });
    const academicYearOutstandingAfter = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
    // Calculate term balance after
    let termOutstandingAfter = 0;
    if (targetTermFee) {
      const charges = transactions.filter(txn => txn.termId === targetTermFee.termId && txn.type === 'invoice').reduce((sum, txn) => sum + (txn.debit || 0), 0);
      const paymentsForTerm = transactions.filter(txn => txn.termId === targetTermFee.termId && txn.type === 'payment').reduce((sum, txn) => sum + (txn.credit || 0), 0);
      termOutstandingAfter = charges - paymentsForTerm;
    }
    // --- Create receipt with correct balances and term/year ---
    const receipt = await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        studentId: student.id,
        receiptNumber: payment.receiptNumber,
        amount: amount,
        paymentDate: new Date(),
        academicYearOutstandingBefore,
        academicYearOutstandingAfter,
        termOutstandingBefore,
        termOutstandingAfter,
        academicYearId: payment.academicYearId,
        termId: payment.termId,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
      }
    });

    return NextResponse.json({
      message: 'Payment processed successfully',
      payment: {
        ...payment,
        studentId: student.id,
        studentName: student.user.name,
        className: student.class?.name,
        admissionNumber: student.admissionNumber,
        term,
        academicYear,
        referenceNumber: payment.referenceNumber,
        receiptNumber: payment.receiptNumber,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        description: payment.description,
        schoolName,
        academicYearOutstandingBefore,
        academicYearOutstandingAfter,
        termOutstandingBefore,
        termOutstandingAfter,
      },
      receipt,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error processing payment:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}

// GET: Fetch payments for a student
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const school = await prisma.school.findUnique({ where: { code: params.schoolCode } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }
    const schoolName = school.name;

    const payments = await prisma.payment.findMany({
      where: { studentId },
      include: {
        student: { include: { user: true, class: true } },
        receipt: true,
        academicYear: true,
        term: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    return NextResponse.json(payments.map(payment => ({
      ...payment,
      studentId: payment.student?.id,
      studentName: payment.student?.user?.name,
      className: payment.student?.class?.name,
      admissionNumber: payment.student?.admissionNumber,
      term: payment.term?.name || payment.description?.match(/Term \d/)?.[0],
      academicYear: payment.academicYear?.name || payment.description?.match(/\d{4}/)?.[0],
      referenceNumber: payment.referenceNumber,
      receiptNumber: payment.receiptNumber,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      description: payment.description,
      schoolName,
      balanceBeforeAcademicYear: payment.receipt?.academicYearOutstandingBefore ?? null,
      balanceAfterAcademicYear: payment.receipt?.academicYearOutstandingAfter ?? null,
      termOutstandingBefore: payment.receipt?.termOutstandingBefore ?? null,
      termOutstandingAfter: payment.receipt?.termOutstandingAfter ?? null,
    })));
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Failed to fetch payments:", errorMessage);
    return NextResponse.json({ error: 'Failed to fetch payments', details: errorMessage }, { status: 500 });
  }
}
