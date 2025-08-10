const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPaymentLogic() {
  console.log('🧪 Testing Payment Logic');
  
  try {
    // Find a test student
    const student = await prisma.student.findFirst({
      where: { isActive: true },
      include: {
        user: true,
        class: { include: { grade: true } },
        payments: {
          include: {
            academicYear: true,
            term: true
          },
          orderBy: { paymentDate: 'asc' }
        }
      }
    });

    if (!student) {
      console.log('❌ No active student found');
      return;
    }

    console.log(`✅ Found student: ${student.user.name} (${student.admissionNumber})`);
    console.log(`📚 Grade: ${student.class?.grade?.name}`);
    console.log(`💰 Total payments: ${student.payments.length}`);

    // Get current academic year
    const currentYear = await prisma.academicYear.findFirst({
      where: { schoolId: student.schoolId, isCurrent: true }
    });

    if (!currentYear) {
      console.log('❌ No current academic year found');
      return;
    }

    console.log(`📅 Current academic year: ${currentYear.name}`);

    // Get fee structures for the student's grade
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class?.gradeId,
        isActive: true,
        academicYearId: currentYear.id,
        NOT: [{ termId: null }]
      },
      include: { termRef: true },
      orderBy: { term: 'asc' }
    });

    console.log(`📋 Found ${feeStructures.length} fee structures`);

    // Calculate balances for each term
    const termBalances = feeStructures.map(fs => {
      const totalAmount = Number(fs.totalAmount);
      const paid = student.payments
        .filter(p => p.termId === fs.termId && p.academicYearId === currentYear.id)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      const outstanding = Math.max(0, totalAmount - paid);
      
      console.log(`📊 ${fs.term}: Amount=${totalAmount}, Paid=${paid}, Outstanding=${outstanding}`);
      
      return {
        term: fs.term,
        year: fs.year,
        totalAmount,
        paid,
        outstanding,
        termId: fs.termId
      };
    });

    // Test payment simulation
    const testAmount = 15000; // Test with 15,000
    console.log(`\n💳 Testing payment of Ksh ${testAmount.toLocaleString()}`);

    let amountLeft = testAmount;
    const paymentDistribution = [];

    // Apply payment to terms
    for (const termBalance of termBalances) {
      if (amountLeft <= 0) break;
      
      if (termBalance.outstanding > 0) {
        const payAmount = Math.min(amountLeft, termBalance.outstanding);
        amountLeft -= payAmount;
        
        paymentDistribution.push({
          term: termBalance.term,
          amountApplied: payAmount,
          outstandingBefore: termBalance.outstanding,
          outstandingAfter: Math.max(0, termBalance.outstanding - payAmount),
          isFullyPaid: (termBalance.outstanding - payAmount) <= 0
        });
        
        console.log(`✅ Applied Ksh ${payAmount.toLocaleString()} to ${termBalance.term}`);
      }
    }

    if (amountLeft > 0) {
      console.log(`⚠️  Remaining amount: Ksh ${amountLeft.toLocaleString()} (overpayment)`);
    }

    console.log('\n📈 Payment Distribution:');
    paymentDistribution.forEach((dist, index) => {
      console.log(`${index + 1}. ${dist.term}: Ksh ${dist.amountApplied.toLocaleString()}`);
      console.log(`   Before: Ksh ${dist.outstandingBefore.toLocaleString()}`);
      console.log(`   After: Ksh ${dist.outstandingAfter.toLocaleString()}`);
      console.log(`   Fully Paid: ${dist.isFullyPaid ? 'Yes' : 'No'}`);
    });

    console.log('\n✅ Payment logic test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPaymentLogic(); 