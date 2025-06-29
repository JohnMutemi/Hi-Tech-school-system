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

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: parseFloat(amount),
        paymentDate: new Date(),
        paymentMethod: paymentMethod === 'mpesa' ? 'mobile_money' : paymentMethod,
        referenceNumber: referenceNumber || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        receiptNumber,
        description: description || `${feeType} - ${term} ${academicYear}`,
        receivedBy: 'Parent Portal' // In a real system, this would be the logged-in user
      }
    });

    console.log('Payment created:', payment.id);

    console.log('Creating receipt record...');

    // Create receipt record
    const receipt = await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        studentId: student.id,
        receiptNumber,
        amount: parseFloat(amount),
        balance: 0, // This will be calculated based on fee structure
        balanceCarriedForward: 0, // This will be calculated based on previous balance
        paymentDate: new Date(),
        format: 'A4'
      }
    });

    console.log('Receipt created:', receipt.id);

    // Update or create student fee record
    // First, find the fee structure for this student's grade and term
    console.log('Looking for fee structure:', {
      gradeId: student.class?.gradeId,
      term,
      year: parseInt(academicYear)
    });

    const feeStructure = await prisma.termlyFeeStructure.findFirst({
      where: {
        gradeId: student.class?.gradeId,
        term,
        year: parseInt(academicYear),
        isActive: true
      }
    });

    if (feeStructure) {
      console.log('Fee structure found:', {
        id: feeStructure.id,
        term: feeStructure.term,
        year: feeStructure.year,
        totalAmount: feeStructure.totalAmount
      });

      // For now, we'll skip the StudentFee creation since it references the wrong model
      // We'll update the receipt with the fee structure information
      const totalAmount = parseFloat(feeStructure.totalAmount.toString());
      const newBalance = Math.max(0, totalAmount - parseFloat(amount));

      console.log('Calculating balance:', {
        totalAmount,
        paymentAmount: parseFloat(amount),
        newBalance
      });

      // Update receipt with correct balance
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: {
          balance: newBalance,
          balanceCarriedForward: totalAmount
        }
      });

      console.log(`Payment processed: Amount ${amount}, Total Fee ${totalAmount}, New Balance ${newBalance}`);
    } else {
      console.log('No fee structure found for this student/term combination');
      // Update receipt with basic information
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: {
          balance: 0,
          balanceCarriedForward: parseFloat(amount)
        }
      });
    }

    // --- Carry-Forward Payment Logic ---
    // 1. Fetch all unpaid or partially paid terms for the student, ordered by year and term
    const allTermStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class?.gradeId,
        year: { gte: parseInt(academicYear) }, // current and future years
        isActive: true
      },
      orderBy: [
        { year: 'asc' },
        { term: 'asc' },
      ]
    });

    // Get all payments for this student for the relevant years
    const allPayments = await prisma.payment.findMany({
      where: {
        studentId: student.id,
        paymentDate: { gte: new Date(`${academicYear}-01-01`) }
      }
    });

    // Calculate paid and outstanding for each term
    let paymentLeft = parseFloat(amount);
    let carryForward = 0;
    let updatedReceipts = [];
    let updatedTerms = [];
    for (const termStruct of allTermStructures) {
      const termPayments = allPayments.filter(p =>
        p.description?.includes(termStruct.term) &&
        p.description?.includes(termStruct.year.toString())
      );
      const paid = termPayments.reduce((sum, p) => sum + p.amount, 0);
      const total = parseFloat(termStruct.totalAmount.toString());
      let outstanding = Math.max(0, total - paid);
      let applied = 0;
      if (paymentLeft > 0 && outstanding > 0) {
        applied = Math.min(paymentLeft, outstanding);
        outstanding -= applied;
        paymentLeft -= applied;
      }
      // If this is the term being paid now, update the receipt
      if (termStruct.term === term && termStruct.year === parseInt(academicYear)) {
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: {
            balance: outstanding,
            balanceCarriedForward: total - outstanding
          }
        });
        updatedReceipts.push({ term: termStruct.term, year: termStruct.year, balance: outstanding });
      }
      updatedTerms.push({
        term: termStruct.term,
        year: termStruct.year,
        total,
        paid: paid + applied,
        outstanding,
        status: outstanding === 0 ? 'paid' : (paid + applied > 0 ? 'partial' : 'pending'),
        carryForward: 0 // will update below
      });
    }
    // Handle carry-forward for overpayment
    if (paymentLeft > 0 && updatedTerms.length > 0) {
      for (let i = 0; i < updatedTerms.length; i++) {
        if (updatedTerms[i].outstanding === 0) continue;
        const apply = Math.min(paymentLeft, updatedTerms[i].outstanding);
        updatedTerms[i].paid += apply;
        updatedTerms[i].outstanding -= apply;
        updatedTerms[i].status = updatedTerms[i].outstanding === 0 ? 'paid' : (updatedTerms[i].paid > 0 ? 'partial' : 'pending');
        paymentLeft -= apply;
        if (paymentLeft <= 0) break;
      }
      carryForward = paymentLeft;
    }
    // Update receipts for all terms if needed (optional: create new receipts for carry-forward payments)
    // ...
    // Return updated fee summary
    return NextResponse.json({
      success: true,
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
      },
      updatedTerms,
      carryForward
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing payment:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}

// GET: Fetch payments for a student
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();
    const { searchParams } = new URL(request.url);
    
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const schoolName = school.name;

    // Fetch payments for the student
    const payments = await prisma.payment.findMany({
      where: {
        studentId,
        student: {
          schoolId: school.id
        }
      },
      include: {
        receipt: true,
        student: {
          include: {
            user: true,
            class: {
              include: {
                grade: true
              }
            }
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });

    return NextResponse.json(payments.map(payment => ({
      ...payment,
      studentId: payment.student?.id,
      studentName: payment.student?.user?.name,
      className: payment.student?.class?.name,
      admissionNumber: payment.student?.admissionNumber,
      term: payment.description?.match(/Term \d/)?[0] : undefined,
      academicYear: payment.description?.match(/\d{4}/)?[0] : undefined,
      referenceNumber: payment.referenceNumber,
      receiptNumber: payment.receiptNumber,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      description: payment.description,
      schoolName,
    })));

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
} 