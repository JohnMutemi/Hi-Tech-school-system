import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const {
      studentId,
      amount,
      paymentMethod,
      phoneNumber,
      transactionId,
      term,
      academicYear,
      referenceNumber,
      receivedBy,
    } = await request.json();

    // Validate required fields
    if (!studentId || !amount || !paymentMethod || !term || !academicYear) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get school
    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // Get student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: true,
        class: {
          include: { grade: true }
        },
        user: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get or create academic year
    let academicYearRecord = await prisma.academicYear.findFirst({
      where: {
        schoolId: school.id,
        name: academicYear
      }
    });

    if (!academicYearRecord) {
      const year = parseInt(academicYear);
      if (isNaN(year)) {
        return NextResponse.json(
          { error: "Invalid academic year format" },
          { status: 400 }
        );
      }
      
      academicYearRecord = await prisma.academicYear.create({
        data: {
          schoolId: school.id,
          name: academicYear,
          startDate: new Date(year, 0, 1),
          endDate: new Date(year, 11, 31),
          isCurrent: false
        }
      });
    }

    // Get term
    let termRecord = await prisma.term.findFirst({
      where: {
        academicYearId: academicYearRecord.id,
        name: term
      }
    });

    if (!termRecord) {
      return NextResponse.json(
        { error: `Term '${term}' not found for academic year '${academicYear}'` },
        { status: 400 }
      );
    }

    // Calculate balances for selected term
    const balanceData = await calculateStudentBalances(studentId, academicYearRecord.id, term);

    // Handle overpayment logic
    const overpaymentResult = handleOverpayment(
      amount,
      balanceData.currentTermBalance,
      balanceData.nextTermBalance
    );

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Generate reference number if not provided
    const finalReferenceNumber = referenceNumber || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        academicYearId: academicYearRecord.id,
        termId: termRecord.id,
        amount: amount,
        paymentMethod: paymentMethod,
        referenceNumber: finalReferenceNumber,
        receiptNumber: receiptNumber,
        description: `School fees payment for ${term} ${academicYear}`,
        paymentDate: new Date(),
        receivedBy: receivedBy || "Parent Portal",
      }
    });

    // Create receipt record
    // Compute academic year and term balances AFTER applying this payment
    const appliedToCurrent = Math.min(amount, balanceData.currentTermBalance);
    const carryForwardApplied = Math.max(0, amount - appliedToCurrent);
    const newNextTermBalance = Math.max(0, balanceData.nextTermBalance - carryForwardApplied);
    const academicYearOutstandingAfter = Math.max(
      0,
      balanceData.academicYearOutstandingBefore - appliedToCurrent - Math.min(carryForwardApplied, balanceData.nextTermBalance)
    );

    const receipt = await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        studentId: student.id,
        receiptNumber: receiptNumber,
        amount: amount,
        paymentDate: new Date(),
        academicYearOutstandingBefore: balanceData.academicYearOutstandingBefore,
        academicYearOutstandingAfter: academicYearOutstandingAfter,
        termOutstandingBefore: balanceData.termOutstandingBefore,
        termOutstandingAfter: Math.max(0, balanceData.currentTermBalance - appliedToCurrent),
        academicYearId: academicYearRecord.id,
        termId: termRecord.id,
        paymentMethod: paymentMethod,
        referenceNumber: finalReferenceNumber,
      }
    });

    // Prepare receipt data for response
    const receiptData = {
      receiptNumber: receipt.receiptNumber,
      paymentId: payment.id,
      studentId: student.id,
      schoolCode: params.schoolCode,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      feeType: "School Fees",
      term: term,
      academicYear: academicYear,
      reference: finalReferenceNumber,
      phoneNumber: payment.phoneNumber,
      transactionId: payment.transactionId,
      status: payment.status,
      issuedAt: new Date(),
      issuedBy: "System",
      schoolName: school.name,
      studentName: student.name || student.user?.name || "Student",
      currency: "KES",
      paymentBreakdown: balanceData.paymentBreakdown,
      currentTermBalance: newNextTermBalance,
      carryForward: carryForwardApplied,
      balance: academicYearOutstandingAfter,
      academicYearOutstandingAfter: academicYearOutstandingAfter,
      termOutstandingAfter: Math.max(0, balanceData.currentTermBalance - appliedToCurrent),
    };

    return NextResponse.json(receiptData);

  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to calculate student balances
async function calculateStudentBalances(studentId: string, academicYearId: string, selectedTermName?: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true }
  });

  if (!student?.class?.gradeId) {
    return {
      currentTermBalance: 0,
      nextTermBalance: 0,
      academicYearOutstandingBefore: 0,
      academicYearOutstandingAfter: 0,
      termOutstandingBefore: 0,
      termOutstandingAfter: 0,
      feeBreakdown: [],
      paymentBreakdown: []
    };
  }

  // Get fee structures for the academic year
  const feeStructures = await prisma.termlyFeeStructure.findMany({
    where: {
      gradeId: student.class.gradeId,
      isActive: true,
      academicYearId: academicYearId,
      NOT: [{ termId: null }]
    },
    include: { termRef: true }
  });

  // Get all payments for the academic year
  const payments = await prisma.payment.findMany({
    where: {
      studentId: student.id,
      academicYearId: academicYearId
    },
    orderBy: { paymentDate: 'asc' }
  });

  // Calculate total charges and payments
  const totalCharges = feeStructures.reduce((sum, fs) => sum + Number(fs.totalAmount), 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const academicYearOutstandingBefore = Math.max(0, totalCharges - totalPayments);

  // Determine current and next term relative to selected term
  const order: Record<string, number> = { "Term 1": 1, "Term 2": 2, "Term 3": 3 };
  const selected = selectedTermName && order[selectedTermName] ? selectedTermName : "Term 1";
  const currentTerm = feeStructures.find(fs => fs.term === selected) || feeStructures.find(fs => fs.term === "Term 1");
  const nextTerm = feeStructures.find(fs => (order[fs.term] || 0) === (order[currentTerm?.term || "Term 1"] || 1) + 1);

  // Calculate term-specific balances
  const currentTermCharges = currentTerm ? Number(currentTerm.totalAmount) : 0;
  const nextTermCharges = nextTerm ? Number(nextTerm.totalAmount) : 0;

  const currentTermPayments = payments
    .filter(p => p.termId === currentTerm?.termId)
    .reduce((sum, p) => sum + p.amount, 0);

  const nextTermPayments = payments
    .filter(p => p.termId === nextTerm?.termId)
    .reduce((sum, p) => sum + p.amount, 0);

  const currentTermBalance = Math.max(0, currentTermCharges - currentTermPayments);
  const nextTermBalance = Math.max(0, nextTermCharges - nextTermPayments);

  // Prepare fee breakdown
  const feeBreakdown = feeStructures.map(fs => ({
    term: fs.term,
    year: fs.year.toString(),
    totalAmount: Number(fs.totalAmount),
    paidAmount: payments
      .filter(p => p.termId === fs.termId)
      .reduce((sum, p) => sum + p.amount, 0),
    outstanding: Math.max(0, Number(fs.totalAmount) - payments
      .filter(p => p.termId === fs.termId)
      .reduce((sum, p) => sum + p.amount, 0))
  }));

  // Prepare payment breakdown
  const paymentBreakdown = payments.map(p => ({
    term: p.termId ? "Term" : "N/A",
    year: academicYearId,
    applied: p.amount,
    total: 0, // Will be calculated
    paid: p.amount,
    outstanding: 0, // Will be calculated
    status: p.status
  }));

  return {
    currentTermBalance,
    nextTermBalance,
    academicYearOutstandingBefore,
    academicYearOutstandingAfter: academicYearOutstandingBefore, // updated after payment
    termOutstandingBefore: currentTermBalance,
    termOutstandingAfter: currentTermBalance, // updated after payment
    feeBreakdown,
    paymentBreakdown
  };
}

// Helper function to handle overpayment logic
function handleOverpayment(
  paymentAmount: number,
  currentTermBalance: number,
  nextTermBalance: number
) {
  const overpayment = paymentAmount - currentTermBalance;
  
  if (overpayment > 0) {
    // Apply to current term first
    const appliedToCurrent = currentTermBalance;
    const carryForward = overpayment;
    
    // Update next term balance
    const newNextTermBalance = Math.max(0, nextTermBalance - carryForward);
    
    return {
      appliedToCurrent,
      carryForward,
      newNextTermBalance,
      overpaymentAmount: overpayment
    };
  }
  
  return {
    appliedToCurrent: paymentAmount,
    carryForward: 0,
    newNextTermBalance: nextTermBalance,
    overpaymentAmount: 0
  };
} 