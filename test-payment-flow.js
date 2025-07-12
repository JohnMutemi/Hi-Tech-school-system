const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Enhanced logging utility for testing
const logTest = (stage, data, type = 'info') => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    stage,
    type,
    data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
  };
  
  console.log(`🧪 [TEST-${stage.toUpperCase()}] ${timestamp}:`, logData);
};

async function testPaymentFlow() {
  logTest('START', 'Payment flow test initiated');
  
  try {
    // Step 1: Find a school
    logTest('STEP_1', 'Finding a school...');
    const school = await prisma.school.findFirst();
    if (!school) {
      throw new Error('No school found in database');
    }
    logTest('SCHOOL_FOUND', { schoolId: school.id, schoolName: school.name, schoolCode: school.code });

    // Step 2: Find a student
    logTest('STEP_2', 'Finding a student...');
    const student = await prisma.student.findFirst({
      where: { schoolId: school.id },
      include: { user: true, class: true }
    });
    if (!student) {
      throw new Error('No student found in database');
    }
    logTest('STUDENT_FOUND', {
      studentId: student.id,
      studentName: student.user.name,
      className: student.class?.name,
      admissionNumber: student.admissionNumber
    });

    // Step 3: Find or create academic year
    logTest('STEP_3', 'Finding academic year...');
    let academicYear = await prisma.academicYear.findFirst({
      where: { schoolId: school.id }
    });
    if (!academicYear) {
      const currentYear = new Date().getFullYear().toString();
      academicYear = await prisma.academicYear.create({
        data: {
          schoolId: school.id,
          name: currentYear,
          startDate: new Date(parseInt(currentYear), 0, 1),
          endDate: new Date(parseInt(currentYear), 11, 31),
          isCurrent: true
        }
      });
      logTest('ACADEMIC_YEAR_CREATED', { academicYearId: academicYear.id, name: academicYear.name });
    } else {
      logTest('ACADEMIC_YEAR_FOUND', { academicYearId: academicYear.id, name: academicYear.name });
    }

    // Step 4: Find or create term
    logTest('STEP_4', 'Finding term...');
    let term = await prisma.term.findFirst({
      where: { academicYearId: academicYear.id }
    });
    if (!term) {
      term = await prisma.term.create({
        data: {
          academicYearId: academicYear.id,
          name: 'Term 1',
          startDate: new Date(parseInt(academicYear.name), 0, 1),
          endDate: new Date(parseInt(academicYear.name), 3, 30),
          isCurrent: true
        }
      });
      logTest('TERM_CREATED', { termId: term.id, name: term.name });
    } else {
      logTest('TERM_FOUND', { termId: term.id, name: term.name });
    }

    // Step 5: Check if student has a grade/class
    logTest('STEP_5', 'Checking student grade...');
    if (!student.class?.gradeId) {
      logTest('NO_GRADE', 'Student has no grade assigned');
      return;
    }
    logTest('GRADE_FOUND', { gradeId: student.class.gradeId, className: student.class.name });

    // Step 6: Check fee structures
    logTest('STEP_6', 'Checking fee structures...');
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class.gradeId,
        academicYearId: academicYear.id,
        termId: term.id,
        isActive: true
      }
    });
    logTest('FEE_STRUCTURES', {
      count: feeStructures.length,
      structures: feeStructures.map(fs => ({
        id: fs.id,
        totalAmount: fs.totalAmount,
        term: fs.term,
        year: fs.year
      }))
    });

    // Step 7: Check existing payments
    logTest('STEP_7', 'Checking existing payments...');
    const existingPayments = await prisma.payment.findMany({
      where: {
        studentId: student.id,
        academicYearId: academicYear.id
      },
      orderBy: { paymentDate: 'desc' }
    });
    logTest('EXISTING_PAYMENTS', {
      count: existingPayments.length,
      payments: existingPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        paymentDate: p.paymentDate,
        receiptNumber: p.receiptNumber
      }))
    });

    // Step 8: Calculate current balances
    logTest('STEP_8', 'Calculating current balances...');
    const totalCharged = feeStructures.reduce((sum, fs) => sum + Number(fs.totalAmount), 0);
    const totalPaid = existingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstanding = totalCharged - totalPaid;
    
    logTest('BALANCE_CALCULATION', {
      totalCharged,
      totalPaid,
      outstanding,
      feeStructuresCount: feeStructures.length,
      paymentsCount: existingPayments.length
    });

    // Step 9: Simulate a payment
    logTest('STEP_9', 'Simulating payment...');
    const paymentAmount = Math.min(50000, outstanding > 0 ? outstanding : 50000);
    
    const paymentData = {
      amount: paymentAmount,
      paymentMethod: 'manual',
      description: `Test payment - ${term.name} ${academicYear.name}`,
      receivedBy: 'Test Script',
      academicYear: academicYear.name,
      term: term.name
    };

    logTest('PAYMENT_DATA', paymentData);

    // Step 10: Create payment record
    logTest('STEP_10', 'Creating payment record...');
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const referenceNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: paymentAmount,
        paymentDate: new Date(),
        paymentMethod: paymentData.paymentMethod,
        referenceNumber,
        receiptNumber,
        description: paymentData.description,
        receivedBy: paymentData.receivedBy,
        academicYearId: academicYear.id,
        termId: term.id,
      }
    });

    logTest('PAYMENT_CREATED', {
      paymentId: payment.id,
      receiptNumber: payment.receiptNumber,
      referenceNumber: payment.referenceNumber,
      amount: payment.amount
    });

    // Step 11: Calculate balances after payment
    logTest('STEP_11', 'Calculating balances after payment...');
    const newTotalPaid = totalPaid + paymentAmount;
    const newOutstanding = totalCharged - newTotalPaid;

    logTest('BALANCE_AFTER_PAYMENT', {
      totalCharged,
      newTotalPaid,
      newOutstanding,
      paymentAmount
    });

    // Step 12: Create receipt
    logTest('STEP_12', 'Creating receipt...');
    const receipt = await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        studentId: student.id,
        receiptNumber: payment.receiptNumber,
        amount: paymentAmount,
        paymentDate: new Date(),
        academicYearOutstandingBefore: outstanding,
        academicYearOutstandingAfter: newOutstanding,
        termOutstandingBefore: outstanding,
        termOutstandingAfter: newOutstanding,
        academicYearId: academicYear.id,
        termId: term.id,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
      }
    });

    logTest('RECEIPT_CREATED', {
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
      amount: receipt.amount
    });

    // Step 13: Final verification
    logTest('STEP_13', 'Final verification...');
    const finalPayments = await prisma.payment.findMany({
      where: {
        studentId: student.id,
        academicYearId: academicYear.id
      },
      orderBy: { paymentDate: 'desc' }
    });

    const finalReceipts = await prisma.receipt.findMany({
      where: {
        studentId: student.id,
        academicYearId: academicYear.id
      },
      orderBy: { paymentDate: 'desc' }
    });

    logTest('FINAL_VERIFICATION', {
      totalPayments: finalPayments.length,
      totalReceipts: finalReceipts.length,
      latestPayment: finalPayments[0] ? {
        id: finalPayments[0].id,
        amount: finalPayments[0].amount,
        receiptNumber: finalPayments[0].receiptNumber
      } : null,
      latestReceipt: finalReceipts[0] ? {
        id: finalReceipts[0].id,
        amount: finalReceipts[0].amount,
        receiptNumber: finalReceipts[0].receiptNumber
      } : null
    });

    logTest('SUCCESS', 'Payment flow test completed successfully!');

    // Summary
    console.log('\n📊 PAYMENT FLOW TEST SUMMARY:');
    console.log('================================');
    console.log(`🏫 School: ${school.name} (${school.code})`);
    console.log(`👤 Student: ${student.user.name} (${student.admissionNumber})`);
    console.log(`📚 Class: ${student.class?.name || 'N/A'}`);
    console.log(`📅 Academic Year: ${academicYear.name}`);
    console.log(`📝 Term: ${term.name}`);
    console.log(`💰 Payment Amount: KES ${paymentAmount.toLocaleString()}`);
    console.log(`🧾 Receipt Number: ${receiptNumber}`);
    console.log(`🔗 Reference Number: ${referenceNumber}`);
    console.log(`📈 Outstanding Before: KES ${outstanding.toLocaleString()}`);
    console.log(`📉 Outstanding After: KES ${newOutstanding.toLocaleString()}`);
    console.log('================================\n');

  } catch (error) {
    logTest('ERROR', error, 'error');
    console.error('❌ Payment flow test failed:', error.message);
  } finally {
    await prisma.$disconnect();
    logTest('END', 'Test completed, database disconnected');
  }
}

// Run the test
if (require.main === module) {
  testPaymentFlow();
}

module.exports = { testPaymentFlow }; 