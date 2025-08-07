import { PrismaClient } from '@prisma/client';
import { SMSService } from './sms-service';

const prisma = new PrismaClient();

// In-memory storage for payments when database is unavailable
let paymentCache: any[] = [];
let receiptCache: any[] = [];

// Enhanced logging utility
const logPayment = (stage: string, data: any, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    stage,
    type,
    data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
  };
  
  console.log(`🔵 [PAYMENT-${stage.toUpperCase()}] ${timestamp}:`, logData);
  
  // Also log to server logs for production
  if (process.env.NODE_ENV === 'production') {
    console.log(`📊 [SERVER-LOG] Payment ${stage}:`, logData);
  }
};

export const paymentService = {
  createDarajaPayment: async (
    schoolCode: string,
    studentId: string,
    paymentData: {
      amount: number;
      phoneNumber: string;
      description: string;
      callbackUrl: string;
    }
  ) => {
    logPayment('START', { schoolCode, studentId, paymentData });
    
    try {
      // Simulate M-Pesa payment processing
      logPayment('SIMULATION_START', {
        amount: paymentData.amount,
        phoneNumber: paymentData.phoneNumber,
        description: paymentData.description
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate simulated transaction details
      const transactionId = `MPESA-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const referenceNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      logPayment('SIMULATION_SUCCESS', { transactionId, referenceNumber });

      // Simulate successful payment
      return {
        success: true,
        transactionId,
        referenceNumber,
        status: 'completed',
        message: 'Payment simulated successfully!',
        metadata: {
          phoneNumber: paymentData.phoneNumber,
          schoolCode,
          studentId,
          simulation: true
        }
      };
    } catch (error) {
      logPayment('SIMULATION_ERROR', error, 'error');
      return {
        success: false,
        status: 'failed',
        message: 'Simulated payment failed'
      };
    }
  },

  createSemiAutomatedPayment: async (
    schoolCode: string,
    studentId: string,
    paymentData: {
      amount: number;
      paymentMethod: string;
      description: string;
      receivedBy: string;
      academicYear?: string;
      term?: string;
    }
  ) => {
    logPayment('PAYMENT_START', { schoolCode, studentId, paymentData });
    try {
      // Simulate payment processing
      logPayment('PROCESSING_START', {
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        description: paymentData.description,
        academicYear: paymentData.academicYear,
        term: paymentData.term
      });
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Fetch school, student, academic year, and grade
      const school = await prisma.school.findUnique({ where: { code: schoolCode } });
      if (!school) throw new Error('School not found');
      const student = await prisma.student.findFirst({
        where: { id: studentId, schoolId: school.id },
        include: { user: true, class: { include: { grade: true } }, parent: true }
      });
      if (!student) throw new Error('Student not found');
      const academicYearRecord = await prisma.academicYear.findFirst({
        where: { schoolId: school.id, name: String(paymentData.academicYear || new Date().getFullYear()) }
      });
      if (!academicYearRecord) throw new Error('Academic year not found');
      const gradeId = student.class?.gradeId;
      if (!gradeId) throw new Error('Student grade not found');

      // Fetch all active termly fee structures for the year, ordered by term
      const feeStructures = await prisma.termlyFeeStructure.findMany({
        where: {
          gradeId,
          isActive: true,
          academicYearId: academicYearRecord.id,
          NOT: [{ termId: null }]
        },
        include: { termRef: true },
        orderBy: { term: 'asc' }
      });
      if (!feeStructures.length) throw new Error('No fee structures found for this grade/year');

      // Fetch all payments for this student for the academic year
      const payments = await prisma.payment.findMany({
        where: { studentId, academicYearId: academicYearRecord.id },
        orderBy: { paymentDate: 'asc' }
      });

      // Calculate outstanding for each term
      const termBalances = feeStructures.map(fs => {
        const paid = payments.filter(p => p.termId === fs.termId).reduce((sum, p) => sum + Number(p.amount), 0);
        return {
          feeStructure: fs,
          outstanding: Math.max(0, Number(fs.totalAmount) - paid),
          paid: paid,
          totalAmount: Number(fs.totalAmount)
        };
      });

      // Find the specific term to pay for
      let targetTermIdx = -1;
      if (paymentData.term) {
        targetTermIdx = feeStructures.findIndex(fs => 
          fs.term === paymentData.term && 
          String(fs.year) === paymentData.academicYear
        );
        
        logPayment('TERM_SEARCH', {
          requestedTerm: paymentData.term,
          requestedYear: paymentData.academicYear,
          targetTermIdx,
          availableTerms: feeStructures.map(fs => ({ term: fs.term, year: fs.year }))
        });
      }
      
      // If specific term not found, start from first unpaid term
      let startTermIdx = 0;
      if (targetTermIdx !== -1) {
        startTermIdx = targetTermIdx;
      } else {
        // Find first unpaid term
        for (let i = 0; i < termBalances.length; i++) {
          if (termBalances[i].outstanding > 0) {
            startTermIdx = i;
            break;
          }
        }
      }

      // Apply payment to specific term first, then handle overpayments
      let amountLeft = paymentData.amount;
      const paymentRecords = [];
      const receiptRecords = [];
      const paymentDistribution = [];
      let overpaymentAmount = 0;
      let nextTermApplied = null;

      // First, apply payment to the specific term if provided
      if (targetTermIdx !== -1 && amountLeft > 0) {
        const { feeStructure, outstanding, paid, totalAmount } = termBalances[targetTermIdx];
        
        if (outstanding > 0) {
          const payAmount = Math.min(amountLeft, outstanding);
          amountLeft -= payAmount;
          
          // Create payment for specific term
          const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          const referenceNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          logPayment('PAYMENT_CREATION', {
            term: feeStructure.term,
            year: feeStructure.year,
            termId: feeStructure.termId,
            amount: payAmount,
            description: paymentData.description
          });
          
          const payment = await prisma.payment.create({
            data: {
              studentId,
              amount: payAmount,
              paymentDate: new Date(),
              paymentMethod: paymentData.paymentMethod || "cash",
              referenceNumber,
              receiptNumber,
              description: paymentData.description,
              receivedBy: paymentData.receivedBy,
              academicYearId: academicYearRecord.id,
              termId: feeStructure.termId!,
            }
          });

          // Calculate balances before/after
          const balancesBefore = await paymentService.calculateBalances(studentId, academicYearRecord.id, feeStructure.termId!);
          const balancesAfter = await paymentService.calculateBalances(studentId, academicYearRecord.id, feeStructure.termId!);
          
          // Create receipt
          const receipt = await prisma.receipt.create({
            data: {
              paymentId: payment.id,
              studentId,
              receiptNumber,
              amount: payAmount,
              paymentDate: new Date(),
              academicYearOutstandingBefore: balancesBefore.academicYearOutstanding,
              academicYearOutstandingAfter: balancesAfter.academicYearOutstanding,
              termOutstandingBefore: balancesBefore.termOutstanding,
              termOutstandingAfter: balancesAfter.termOutstanding,
              academicYearId: academicYearRecord.id,
              termId: feeStructure.termId!,
              paymentMethod: paymentData.paymentMethod,
              referenceNumber,
            }
          });

          paymentRecords.push(payment);
          receiptRecords.push(receipt);
          
          // Track payment distribution
          paymentDistribution.push({
            term: feeStructure.term,
            year: feeStructure.year,
            termId: feeStructure.termId,
            amountApplied: payAmount,
            outstandingBefore: outstanding,
            outstandingAfter: Math.max(0, outstanding - payAmount),
            isFullyPaid: (outstanding - payAmount) <= 0
          });
        }
      }

      // Then handle overpayments by applying remaining amount to subsequent terms
      if (amountLeft > 0) {
        for (let i = startTermIdx + 1; i < termBalances.length && amountLeft > 0; i++) {
          const { feeStructure, outstanding, paid, totalAmount } = termBalances[i];
          
          if (outstanding <= 0) continue; // Already paid
          
          const payAmount = Math.min(amountLeft, outstanding);
          amountLeft -= payAmount;
          
          // Create payment for overpayment
          const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          const referenceNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const payment = await prisma.payment.create({
            data: {
              studentId,
              amount: payAmount,
              paymentDate: new Date(),
              paymentMethod: paymentData.paymentMethod || "cash",
              referenceNumber,
              receiptNumber,
              description: `${paymentData.description} (Overpayment applied to ${feeStructure.term})`,
              receivedBy: paymentData.receivedBy,
              academicYearId: academicYearRecord.id,
              termId: feeStructure.termId!,
            }
          });

          // Calculate balances before/after
          const balancesBefore = await paymentService.calculateBalances(studentId, academicYearRecord.id, feeStructure.termId!);
          const balancesAfter = await paymentService.calculateBalances(studentId, academicYearRecord.id, feeStructure.termId!);
          
          // Create receipt
          const receipt = await prisma.receipt.create({
            data: {
              paymentId: payment.id,
              studentId,
              receiptNumber,
              amount: payAmount,
              paymentDate: new Date(),
              academicYearOutstandingBefore: balancesBefore.academicYearOutstanding,
              academicYearOutstandingAfter: balancesAfter.academicYearOutstanding,
              termOutstandingBefore: balancesBefore.termOutstanding,
              termOutstandingAfter: balancesAfter.termOutstanding,
              academicYearId: academicYearRecord.id,
              termId: feeStructure.termId!,
              paymentMethod: paymentData.paymentMethod,
              referenceNumber,
            }
          });

          paymentRecords.push(payment);
          receiptRecords.push(receipt);
          
          // Track overpayment distribution
          paymentDistribution.push({
            term: feeStructure.term,
            year: feeStructure.year,
            termId: feeStructure.termId,
            amountApplied: payAmount,
            outstandingBefore: outstanding,
            outstandingAfter: Math.max(0, outstanding - payAmount),
            isFullyPaid: (outstanding - payAmount) <= 0,
            isOverpayment: true
          });

          overpaymentAmount += payAmount;
          nextTermApplied = {
            term: feeStructure.term,
            year: feeStructure.year,
            amount: payAmount
          };
        }
      }

      // If there's still amount left, it's an overpayment for future terms
      if (amountLeft > 0) {
        overpaymentAmount = amountLeft;
      }

      // Return detailed payment information
      return {
        success: true,
        payment: paymentRecords[paymentRecords.length - 1],
        receipt: receiptRecords[receiptRecords.length - 1],
        allPayments: paymentRecords,
        allReceipts: receiptRecords,
        paymentDistribution,
        overpaymentAmount,
        nextTermApplied,
        totalPaid: paymentData.amount,
        remainingBalance: amountLeft
      };
    } catch (error) {
      logPayment('PAYMENT_ERROR', error, 'error');
      console.error('Payment simulation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Payment simulation failed'
      };
    }
  },

  calculateBalances: async (studentId: string, academicYearId: string, termId: string) => {
    logPayment('BALANCE_CALC_START', { studentId, academicYearId, termId });
    
    try {
      // Get all termly fee structures for this student/grade for the academic year
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { class: true }
      });

      if (!student?.class?.gradeId) {
        logPayment('BALANCE_CALC_NO_GRADE', { studentId });
        return { academicYearOutstanding: 0, termOutstanding: 0 };
      }

      logPayment('BALANCE_CALC_STUDENT_FOUND', { 
        studentId, 
        gradeId: student.class.gradeId,
        className: student.class.name
      });

      const feeStructures = await prisma.termlyFeeStructure.findMany({
        where: {
          gradeId: student.class.gradeId,
          isActive: true,
          academicYearId,
          NOT: [{ termId: null }]
        }
      });

      logPayment('BALANCE_CALC_FEE_STRUCTURES', { 
        count: feeStructures.length,
        structures: feeStructures.map(fs => ({
          id: fs.id,
          term: fs.term,
          totalAmount: fs.totalAmount
        }))
      });

      // Get all payments for this student for the academic year
      const payments = await prisma.payment.findMany({
        where: {
          studentId,
          academicYearId
        },
        orderBy: { paymentDate: 'asc' }
      });

      logPayment('BALANCE_CALC_PAYMENTS', { 
        count: payments.length,
        payments: payments.map(p => ({
          id: p.id,
          amount: p.amount,
          date: p.paymentDate
        }))
      });

      // Build transactions: charges (debit), payments (credit)
      let transactions: any[] = [];
      
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

      // Sort by date and calculate running balance
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

      // Calculate term balance
      const targetTermFee = feeStructures.find(fs => fs.termId === termId);
      let termOutstanding = 0;
      
      if (targetTermFee) {
        const charges = transactions
          .filter(txn => txn.termId === targetTermFee.termId && txn.type === 'invoice')
          .reduce((sum, txn) => sum + (txn.debit || 0), 0);
        
        const paymentsForTerm = transactions
          .filter(txn => txn.termId === targetTermFee.termId && txn.type === 'payment')
          .reduce((sum, txn) => sum + (txn.credit || 0), 0);
        
        termOutstanding = charges - paymentsForTerm;
      }

      const result = {
        academicYearOutstanding,
        termOutstanding
      };

      logPayment('BALANCE_CALC_COMPLETE', result);
      return result;

    } catch (error) {
      logPayment('BALANCE_CALC_ERROR', error, 'error');
      return { academicYearOutstanding: 0, termOutstanding: 0 };
    }
  },

  getPaymentHistory: async (studentId: string) => {
    logPayment('HISTORY_REQUEST', { studentId });
    
    try {
      const payments = await prisma.payment.findMany({
        where: { studentId },
        include: {
          receipt: true,
          academicYear: true,
          term: true,
          student: {
            include: {
              user: true,
              class: true
            }
          }
        },
        orderBy: { paymentDate: 'desc' }
      });

      logPayment('HISTORY_RETRIEVED', { 
        studentId, 
        paymentCount: payments.length 
      });

      return payments;
    } catch (error) {
      logPayment('HISTORY_ERROR', error, 'error');
      return [];
    }
  },

  getPendingPaymentRequests: async (studentId: string) => {
    logPayment('PENDING_REQUESTS_REQUEST', { studentId });
    
    try {
      const requests = await prisma.paymentRequest.findMany({
        where: {
          studentId,
          status: 'pending',
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      logPayment('PENDING_REQUESTS_RETRIEVED', { 
        studentId, 
        requestCount: requests.length 
      });

      return requests;
    } catch (error) {
      logPayment('PENDING_REQUESTS_ERROR', error, 'error');
      return [];
    }
  },

  createPayment: async () => ({
    success: true,
    message: 'Payment simulated successfully!',
  }),
}; 