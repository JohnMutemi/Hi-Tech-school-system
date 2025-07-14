import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Builds a transaction ledger and calculates the running balance for a student.
 * Filters by join date/term if provided, and optionally by academic year.
 * Returns { transactions, outstandingBalance }
 */
export async function calculateStudentOutstanding({
  student,
  feeStructures,
  payments,
  joinAcademicYearId,
  joinTermId,
  joinDate,
  filterAcademicYear, // e.g. 2025 or undefined for all
}: {
  student: any,
  feeStructures: any[],
  payments: any[],
  joinAcademicYearId?: string,
  joinTermId?: string,
  joinDate?: Date,
  filterAcademicYear?: number,
}) {
  // Filter fee structures
  let filteredFeeStructures = feeStructures;
  if (joinAcademicYearId && joinTermId) {
    // Find the join term's name
    const joinTermObj = feeStructures.find(t => t.termId === joinTermId);
    const joinTermName = joinTermObj?.term;
    const termOrder: Record<string, number> = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
    filteredFeeStructures = filteredFeeStructures.filter(fs => {
      if (!fs.academicYearId || !fs.term) return false;
      if (fs.academicYearId < joinAcademicYearId) return false;
      if (fs.academicYearId === joinAcademicYearId && joinTermName) {
        return termOrder[fs.term] >= termOrder[joinTermName];
      }
      return true;
    });
  } else if (joinDate) {
    filteredFeeStructures = filteredFeeStructures.filter(fs => {
      return fs.createdAt && new Date(fs.createdAt) >= joinDate;
    });
  }
  if (filterAcademicYear) {
    filteredFeeStructures = filteredFeeStructures.filter(fs => fs.year === filterAcademicYear);
  }

  // Filter payments
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
  if (filterAcademicYear) {
    filteredPayments = filteredPayments.filter(p => {
      // Try to match by year, academicYearId, or academicYear?.name
      if (p.year && p.year === filterAcademicYear) return true;
      if (p.academicYearId && filteredFeeStructures.some(fs => fs.academicYearId === p.academicYearId && fs.year === filterAcademicYear)) return true;
      if (p.academicYear?.name && p.academicYear?.name === filterAcademicYear.toString()) return true;
      return false;
    });
  }

  // DEBUG LOGS
  console.log('DEBUG: Filtered Fee Structures:', filteredFeeStructures);
  console.log('DEBUG: Filtered Payments:', filteredPayments);

  // Build transactions: charges (debit), payments (credit)
  let transactions: any[] = [];
  // Charges (invoices)
  for (const fs of filteredFeeStructures) {
    transactions.push({
      ref: fs.id,
      description: `INVOICE - ${fs.term || ''} ${fs.year || ''}`,
      debit: Number(fs.totalAmount),
      credit: 0,
      date: fs.createdAt,
      type: 'invoice',
      termId: fs.termId,
      academicYearId: fs.academicYearId,
      termName: fs.term || '',
      academicYearName: fs.year ? fs.year.toString() : ''
    });
  }
  // Payments (credits)
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
  // Sort all transactions by date
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
  // Outstanding is the last running balance
  const outstandingBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
  return { transactions, outstandingBalance };
} 