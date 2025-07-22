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

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate receipt number and reference
      const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const referenceNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      logPayment('REFERENCE_GENERATED', { receiptNumber, referenceNumber });

      try {
        // Try to save to database
        logPayment('DB_CONNECTION_START', 'Attempting database connection...');
        
        const school = await prisma.school.findUnique({ where: { code: schoolCode } });
        if (!school) {
          throw new Error('School not found');
        }
        logPayment('SCHOOL_FOUND', { schoolId: school.id, schoolName: school.name });

        const student = await prisma.student.findFirst({
          where: { id: studentId, schoolId: school.id },
          include: { 
            user: true, 
            class: true,
            parent: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              }
            }
          }
        });
        if (!student) {
          throw new Error('Student not found');
        }
        logPayment('STUDENT_FOUND', { 
          studentId: student.id, 
          studentName: student.user.name,
          className: student.class?.name,
          admissionNumber: student.admissionNumber
        });

        // Find or create academic year and term
        logPayment('ACADEMIC_YEAR_LOOKUP', { academicYear: paymentData.academicYear });
        
        let academicYearRecord = await prisma.academicYear.findFirst({
          where: {
            schoolId: school.id,
            name: paymentData.academicYear || new Date().getFullYear().toString()
          }
        });

        if (!academicYearRecord) {
          const year = parseInt(paymentData.academicYear || new Date().getFullYear().toString());
          academicYearRecord = await prisma.academicYear.create({
            data: {
              schoolId: school.id,
              name: year.toString(),
              startDate: new Date(year, 0, 1),
              endDate: new Date(year, 11, 31),
              isCurrent: false
            }
          });
          logPayment('ACADEMIC_YEAR_CREATED', { 
            academicYearId: academicYearRecord.id, 
            name: academicYearRecord.name 
          });
        } else {
          logPayment('ACADEMIC_YEAR_FOUND', { 
            academicYearId: academicYearRecord.id, 
            name: academicYearRecord.name 
          });
        }

        logPayment('TERM_LOOKUP', { term: paymentData.term });
        
        let termRecord = await prisma.term.findFirst({
          where: {
            academicYearId: academicYearRecord.id,
            name: paymentData.term || 'Term 1'
          }
        });

        if (!termRecord) {
          throw new Error(`Term '${paymentData.term}' not found for academic year '${academicYearRecord.name}'`);
        }
        logPayment('TERM_FOUND', { termId: termRecord.id, termName: termRecord.name });

        // Calculate balances before payment
        logPayment('BALANCE_CALCULATION_START', 'Calculating balances before payment...');
        const balances = await paymentService.calculateBalances(studentId, academicYearRecord.id, termRecord.id);
        logPayment('BALANCE_BEFORE', {
          academicYearOutstanding: balances.academicYearOutstanding,
          termOutstanding: balances.termOutstanding
        });

        // Create payment record
        logPayment('PAYMENT_CREATION_START', {
          studentId,
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          referenceNumber,
          receiptNumber,
          academicYearId: academicYearRecord.id,
          termId: termRecord.id
        });

        const payment = await prisma.payment.create({
          data: {
            studentId,
            amount: paymentData.amount,
            paymentDate: new Date(),
            paymentMethod: paymentData.paymentMethod,
            referenceNumber,
            receiptNumber,
            description: paymentData.description,
            receivedBy: paymentData.receivedBy,
            academicYearId: academicYearRecord.id,
            termId: termRecord.id,
          }
        });

        logPayment('PAYMENT_SAVED', {
          paymentId: payment.id,
          receiptNumber: payment.receiptNumber,
          referenceNumber: payment.referenceNumber,
          amount: payment.amount
        });

        // Calculate balances after payment
        logPayment('BALANCE_CALCULATION_AFTER', 'Calculating balances after payment...');
        const balancesAfter = await paymentService.calculateBalances(studentId, academicYearRecord.id, termRecord.id);
        logPayment('BALANCE_AFTER', {
          academicYearOutstanding: balancesAfter.academicYearOutstanding,
          termOutstanding: balancesAfter.termOutstanding
        });

        // Create receipt
        logPayment('RECEIPT_CREATION_START', {
          paymentId: payment.id,
          studentId: student.id,
          receiptNumber: payment.receiptNumber
        });

        const receipt = await prisma.receipt.create({
          data: {
            paymentId: payment.id,
            studentId: student.id,
            receiptNumber: payment.receiptNumber,
            amount: paymentData.amount,
            paymentDate: new Date(),
            academicYearOutstandingBefore: balances.academicYearOutstanding,
            academicYearOutstandingAfter: balancesAfter.academicYearOutstanding,
            termOutstandingBefore: balances.termOutstanding,
            termOutstandingAfter: balancesAfter.termOutstanding,
            academicYearId: payment.academicYearId,
            termId: payment.termId,
            paymentMethod: payment.paymentMethod,
            referenceNumber: payment.referenceNumber,
          }
        });

        logPayment('RECEIPT_SAVED', {
          receiptId: receipt.id,
          receiptNumber: receipt.receiptNumber,
          amount: receipt.amount
        });

        const paymentResult = {
          ...payment,
          studentName: student.user.name,
          className: student.class?.name,
          admissionNumber: student.admissionNumber,
          term: termRecord.name,
          academicYear: academicYearRecord.name,
          schoolName: school.name,
          academicYearOutstandingBefore: balances.academicYearOutstanding,
          academicYearOutstandingAfter: balancesAfter.academicYearOutstanding,
          termOutstandingBefore: balances.termOutstanding,
          termOutstandingAfter: balancesAfter.termOutstanding,
        };

        // Send SMS notification to parent if phone number exists
        let smsResult = null;
        if (student.parent?.phone) {
          try {
            smsResult = await SMSService.sendPaymentConfirmation(
              student.parent.phone,
              student.parent.name,
              student.user.name,
              paymentData.amount,
              new Date(),
              school.name,
              paymentData.paymentMethod
            );
            logPayment('SMS_SENT', { 
              phone: student.parent.phone,
              success: smsResult.success,
              messageId: smsResult.messageId 
            });
          } catch (smsError) {
            logPayment('SMS_ERROR', smsError, 'error');
            // Don't fail the payment if SMS fails
          }
        }

        logPayment('PAYMENT_COMPLETE', {
          success: true,
          paymentId: payment.id,
          receiptId: receipt.id,
          finalBalance: balancesAfter.academicYearOutstanding,
          smsSent: !!smsResult?.success
        });

        return {
          success: true,
          payment: paymentResult,
          receipt,
          sms: smsResult
        };

      } catch (dbError) {
        logPayment('DB_ERROR', dbError, 'error');
        console.warn('Database connection failed, using cache:', dbError);
        
        // Fallback to in-memory storage
        const paymentRecord = {
          id: `cache-${Date.now()}`,
          studentId,
          amount: paymentData.amount,
          paymentDate: new Date(),
          paymentMethod: paymentData.paymentMethod,
          referenceNumber,
          receiptNumber,
          description: paymentData.description,
          receivedBy: paymentData.receivedBy,
          academicYear: paymentData.academicYear,
          term: paymentData.term,
          studentName: 'Student (Cache)',
          className: 'Class (Cache)',
          admissionNumber: 'N/A',
          schoolName: 'School (Cache)',
          academicYearOutstandingBefore: 0,
          academicYearOutstandingAfter: 0,
          termOutstandingBefore: 0,
          termOutstandingAfter: 0,
        };

        const receiptRecord = {
          id: `receipt-${Date.now()}`,
          paymentId: paymentRecord.id,
          studentId,
          receiptNumber,
          amount: paymentData.amount,
          paymentDate: new Date(),
          academicYearOutstandingBefore: 0,
          academicYearOutstandingAfter: 0,
          termOutstandingBefore: 0,
          termOutstandingAfter: 0,
          academicYear: paymentData.academicYear,
          term: paymentData.term,
          paymentMethod: paymentData.paymentMethod,
          referenceNumber,
        };

        // Store in cache
        paymentCache.push(paymentRecord);
        receiptCache.push(receiptRecord);

        logPayment('CACHE_SAVED', {
          paymentId: paymentRecord.id,
          receiptId: receiptRecord.id,
          cacheSize: paymentCache.length
        });

        return {
          success: true,
          payment: paymentRecord,
          receipt: receiptRecord,
          cached: true
        };
      }

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