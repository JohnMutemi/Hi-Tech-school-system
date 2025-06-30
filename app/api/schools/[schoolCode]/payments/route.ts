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
      term,
      academicYear,
      phoneNumber,
      transactionId,
      referenceNumber,
      description
    } = body;

    // Validate required fields
    if (!studentId || !amount || !paymentMethod || !feeType || !term || !academicYear) {
      console.log('Missing required fields:', { studentId, amount, paymentMethod, feeType, term, academicYear });
      return NextResponse.json(
        { error: 'Missing required fields: studentId, amount, paymentMethod, feeType, term, academicYear' },
        { status: 400 }
      );
    }

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    });

    if (!school) {
      console.log('School not found:', schoolCode);
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const schoolName = school.name;

    console.log('School found:', school.id);

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
      console.log('Student not found:', { studentId, schoolId: school.id });
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    console.log('Student found:', { 
      studentId: student.id, 
      studentName: student.user.name,
      gradeId: student.class?.gradeId,
      gradeName: student.class?.grade?.name
    });

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    console.log('Creating payment record...');

    // Create the payment record
    const newPayment = await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: parseFloat(amount),
        paymentDate: new Date(),
        paymentMethod: paymentMethod === 'mpesa' ? 'mobile_money' : paymentMethod,
        referenceNumber: referenceNumber || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        receiptNumber: `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        description: description || `${feeType} - ${term} ${academicYear}`,
        receivedBy: 'Parent Portal',
        term,
        academicYear: parseInt(academicYear, 10),
      }
    });

    console.log('Payment created:', newPayment.id);
    
    // --- New Payment Allocation & Receipt Logic ---

    // 1. Fetch all applicable term structures for the student's grade
    const allTermStructures = await prisma.termlyFeeStructure.findMany({
        where: { gradeId: student.class?.gradeId, isActive: true },
        orderBy: [{ year: 'asc' }, { term: 'asc' }],
    });

    // 2. Fetch all payments for the student (including the new one)
    const allPayments = await prisma.payment.findMany({
        where: { studentId: student.id },
        orderBy: { paymentDate: 'asc' },
    });

    // 3. Define a function to allocate payments and get term balances
    const calculateTermBalances = (payments: typeof allPayments, structures: typeof allTermStructures) => {
        let totalPaidPool = payments.reduce((sum, p) => sum + p.amount, 0);
        
        const termBalances = structures.map(s => ({
            term: s.term,
            year: s.year,
            due: parseFloat(s.totalAmount.toString()),
            paid: 0,
            balance: parseFloat(s.totalAmount.toString()),
        }));

        for (const term of termBalances) {
            if (totalPaidPool <= 0) break;
            const amountToPay = Math.min(totalPaidPool, term.balance);
            term.paid += amountToPay;
            term.balance -= amountToPay;
            totalPaidPool -= amountToPay;
        }
        
        // If there's a credit balance, represent it as a negative balance on the last term
        if (totalPaidPool > 0 && termBalances.length > 0) {
            termBalances[termBalances.length - 1].balance -= totalPaidPool;
        }

        return termBalances;
    };

    // 4. Calculate balance BEFORE this payment (for the specific term)
    const paymentsBefore = allPayments.filter(p => p.id !== newPayment.id);
    const balancesBefore = calculateTermBalances(paymentsBefore, allTermStructures);
    const termStateBefore = balancesBefore.find(b => b.term === term && b.year === parseInt(academicYear));
    const balanceBeforePayment = termStateBefore ? termStateBefore.balance : 0;

    // 5. Calculate balance AFTER this payment (for the specific term)
    const balancesAfter = calculateTermBalances(allPayments, allTermStructures);
    const termStateAfter = balancesAfter.find(b => b.term === term && b.year === parseInt(academicYear));
    const balanceAfterPayment = termStateAfter ? termStateAfter.balance : 0;

    // 6. Create the receipt with correct, snapshot-in-time data
    const receipt = await prisma.receipt.create({
        data: {
            paymentId: newPayment.id,
            studentId: student.id,
            receiptNumber: newPayment.receiptNumber,
            amount: newPayment.amount,
            balance: balanceAfterPayment,
            balanceCarriedForward: balanceBeforePayment,
            paymentDate: newPayment.paymentDate,
            format: 'A4'
        }
    });

    console.log('Receipt created with accurate balances:', receipt.id);

    return NextResponse.json({
      message: 'Payment processed successfully',
      payment: { ...newPayment, receipt }
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
        
        const payments = await prisma.payment.findMany({
            where: { studentId },
            include: {
                student: { include: { user: true, class: true } },
                receipt: true,
            },
            orderBy: {
                paymentDate: 'desc',
            },
        });

        // Ensure term and academicYear are always returned as part of the main object
        const formattedPayments = payments.map(p => ({
            ...p,
            term: p.term,
            academicYear: p.academicYear,
        }));

        return NextResponse.json(formattedPayments);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Failed to fetch payments:", errorMessage);
        return NextResponse.json({ error: 'Failed to fetch payments', details: errorMessage }, { status: 500 });
    }
} 