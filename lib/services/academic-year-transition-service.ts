import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AcademicYearTransitionService {
  /**
   * Get or create StudentYearlyBalance record for a specific year
   */
  async getOrCreateYearlyBalance(studentId: string, academicYear: number) {
    let yearlyBalance = await prisma.studentYearlyBalance.findUnique({
      where: {
        studentId_academicYear: {
          studentId,
          academicYear
        }
      }
    });

    if (!yearlyBalance) {
      // Check for previous year's closing balance to use as opening balance
      const previousYear = academicYear - 1;
      const previousYearBalance = await prisma.studentYearlyBalance.findUnique({
        where: {
          studentId_academicYear: {
            studentId,
            academicYear: previousYear
          }
        }
      });

      const openingBalance = previousYearBalance?.closingBalance || 0;

      yearlyBalance = await prisma.studentYearlyBalance.create({
        data: {
          studentId,
          academicYear,
          openingBalance,
          totalCharged: 0,
          totalPaid: 0,
          closingBalance: openingBalance,
          isCarriedForward: openingBalance > 0
        }
      });
    }

    return yearlyBalance;
  }

  /**
   * Update yearly balance when payments or charges are added
   */
  async updateYearlyBalance(
    studentId: string,
    academicYear: number,
    chargesDelta: number = 0,
    paymentsDelta: number = 0
  ) {
    const yearlyBalance = await this.getOrCreateYearlyBalance(studentId, academicYear);

    const newTotalCharged = yearlyBalance.totalCharged + chargesDelta;
    const newTotalPaid = yearlyBalance.totalPaid + paymentsDelta;
    const newClosingBalance = yearlyBalance.openingBalance + newTotalCharged - newTotalPaid;

    await prisma.studentYearlyBalance.update({
      where: {
        studentId_academicYear: {
          studentId,
          academicYear
        }
      },
      data: {
        totalCharged: newTotalCharged,
        totalPaid: newTotalPaid,
        closingBalance: newClosingBalance
      }
    });

    return newClosingBalance;
  }

  /**
   * Calculate comprehensive student balance with proper carry forward logic
   */
  async calculateStudentBalanceWithCarryForward(
    studentId: string,
    targetAcademicYearId: string
  ) {
    // Get student and related data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { 
        class: { include: { grade: true } }
      }
    });

    if (!student?.class?.gradeId) {
      throw new Error('Student class/grade not found');
    }

    // Get target academic year
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: targetAcademicYearId }
    });

    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    const academicYearNumber = parseInt(academicYear.name);

    // Get or create yearly balance record
    await this.getOrCreateYearlyBalance(studentId, academicYearNumber);

    // Get fee structures for this academic year
    const feeStructures = await prisma.termlyFeeStructure.findMany({
      where: {
        gradeId: student.class.gradeId,
        academicYearId: targetAcademicYearId,
        isActive: true,
        NOT: [{ termId: null }]
      },
      orderBy: { term: 'asc' },
      include: { termRef: true }
    });

    // Get all payments for this academic year
    const payments = await prisma.payment.findMany({
      where: {
        studentId,
        academicYearId: targetAcademicYearId
      },
      include: {
        term: true,
        academicYear: true
      }
    });

    // Get yearly balance for opening balance
    const yearlyBalance = await prisma.studentYearlyBalance.findUnique({
      where: {
        studentId_academicYear: {
          studentId,
          academicYear: academicYearNumber
        }
      }
    });

    let carryForward = yearlyBalance?.openingBalance || 0;
    const termBalances = [];

    // Process each term in order
    for (let i = 0; i < feeStructures.length; i++) {
      const fs = feeStructures[i];
      
      // Calculate charges for this term
      const termCharges = Number(fs.totalAmount);
      
      // Calculate payments for this term
      const termPayments = payments
        .filter(p => p.termId === fs.termId)
        .reduce((sum, p) => sum + p.amount, 0);

      // Calculate base balance (before carry forward)
      const baseBalance = termCharges - termPayments;
      
      // Apply carry forward from previous terms/year
      let termBalance = baseBalance + carryForward;
      let carryToNext = 0;

      // Handle overpayments (negative balance)
      if (termBalance < 0) {
        carryToNext = termBalance; // Negative amount to carry forward
        termBalance = 0; // Term balance becomes zero when overpaid
      } else if (termBalance > 0) {
        // If there's still an outstanding balance, it doesn't carry forward
        carryToNext = 0;
      }

      // For the last term, carry forward goes to next academic year
      const isLastTerm = i === feeStructures.length - 1;
      
      termBalances.push({
        termId: fs.termId,
        academicYearId: fs.academicYearId,
        term: fs.term,
        year: fs.year,
        totalAmount: termCharges,
        paidAmount: termPayments,
        baseBalance,
        carryForward,
        balance: termBalance,
        carryToNext: isLastTerm ? 0 : carryToNext, // Last term doesn't carry to next term
        carryToNextYear: isLastTerm ? carryToNext : 0 // Only last term carries to next year
      });

      // Update carry forward for next iteration
      if (!isLastTerm) {
        carryForward = carryToNext;
      } else {
        // Handle end-of-year carry forward
        if (carryToNext !== 0) {
          await this.handleYearEndCarryForward(studentId, academicYearNumber + 1, carryToNext);
        }
      }
    }

    return {
      termBalances,
      yearlyBalance,
      totalCharges: feeStructures.reduce((sum, fs) => sum + Number(fs.totalAmount), 0),
      totalPayments: payments.reduce((sum, p) => sum + p.amount, 0),
      academicYearOutstanding: termBalances.reduce((sum, tb) => sum + tb.balance, 0)
    };
  }

  /**
   * Handle carry forward to next academic year
   */
  async handleYearEndCarryForward(
    studentId: string,
    nextAcademicYear: number,
    carryForwardAmount: number
  ) {
    // Get or create next year's balance record
    let nextYearBalance = await prisma.studentYearlyBalance.findUnique({
      where: {
        studentId_academicYear: {
          studentId,
          academicYear: nextAcademicYear
        }
      }
    });

    if (!nextYearBalance) {
      // Create next year's record with the carry forward as opening balance
      nextYearBalance = await prisma.studentYearlyBalance.create({
        data: {
          studentId,
          academicYear: nextAcademicYear,
          openingBalance: carryForwardAmount,
          totalCharged: 0,
          totalPaid: 0,
          closingBalance: carryForwardAmount,
          isCarriedForward: true
        }
      });
    } else {
      // Update existing record with new opening balance
      await prisma.studentYearlyBalance.update({
        where: { id: nextYearBalance.id },
        data: {
          openingBalance: carryForwardAmount,
          closingBalance: nextYearBalance.totalCharged - nextYearBalance.totalPaid + carryForwardAmount,
          isCarriedForward: carryForwardAmount !== 0
        }
      });
    }

    return nextYearBalance;
  }

  /**
   * Get student arrears including carry forwards from previous years
   */
  async getStudentArrears(studentId: string, currentAcademicYear: number) {
    const yearlyBalances = await prisma.studentYearlyBalance.findMany({
      where: {
        studentId,
        academicYear: { lt: currentAcademicYear },
        closingBalance: { gt: 0 }
      },
      orderBy: { academicYear: 'asc' }
    });

    return yearlyBalances.reduce((total, balance) => total + balance.closingBalance, 0);
  }

  /**
   * Process payment with enhanced carry forward logic
   */
  async processPaymentWithCarryForward(
    studentId: string,
    amount: number,
    academicYearId: string,
    termId: string
  ) {
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId }
    });

    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    const academicYearNumber = parseInt(academicYear.name);

    // Get current balance state
    const balanceData = await this.calculateStudentBalanceWithCarryForward(studentId, academicYearId);
    
    // Find current term
    const currentTermBalance = balanceData.termBalances.find(tb => tb.termId === termId);
    if (!currentTermBalance) {
      throw new Error('Term not found in balance data');
    }

    // Calculate how payment will be applied
    const appliedToCurrent = Math.min(amount, currentTermBalance.balance);
    const overpayment = amount - appliedToCurrent;

    let carryForwardDetails = null;
    if (overpayment > 0) {
      // Find next term or prepare for next year carry forward
      const currentTermIndex = balanceData.termBalances.findIndex(tb => tb.termId === termId);
      const nextTerm = balanceData.termBalances[currentTermIndex + 1];

      if (nextTerm) {
        // Apply to next term
        const appliedToNext = Math.min(overpayment, nextTerm.balance);
        carryForwardDetails = {
          nextTermId: nextTerm.termId,
          appliedToNext,
          remainingOverpayment: overpayment - appliedToNext
        };
      } else {
        // Carry forward to next academic year
        carryForwardDetails = {
          nextAcademicYear: academicYearNumber + 1,
          carryForwardAmount: overpayment
        };
      }
    }

    // Update yearly balance
    await this.updateYearlyBalance(studentId, academicYearNumber, 0, amount);

    return {
      appliedToCurrent,
      overpayment,
      carryForwardDetails,
      newTermBalance: Math.max(0, currentTermBalance.balance - appliedToCurrent),
      newAcademicYearBalance: Math.max(0, balanceData.academicYearOutstanding - amount)
    };
  }
}

export const academicYearTransitionService = new AcademicYearTransitionService();
