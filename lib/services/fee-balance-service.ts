import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface StudentFeeBalance {
  studentId: string;
  academicYear: string;
  term: string;
  totalRequired: number;
  totalPaid: number;
  balance: number;
  lastUpdated: Date;
  feeBreakdown: Record<string, number>;
  paymentHistory: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  receivedBy: string;
  receiptNumber: string;
  referenceNumber?: string;
  description: string;
}

export interface FeeStructureItem {
  name: string;
  amount: number;
  required: boolean;
  category: 'tuition' | 'boarding' | 'transport' | 'uniform' | 'books' | 'activities' | 'other';
}

class FeeBalanceService {
  /**
   * Get existing fee structure for a grade or return a default structure based on grade level
   */
  async getFeeStructureForGrade(schoolId: string, gradeId: string, academicYear: string, term: string) {
    const existing = await prisma.termlyFeeStructure.findFirst({
      where: {
        schoolId,
        gradeId,
        year: parseInt(academicYear),
        term,
        isActive: true,
      },
    });

    if (existing) {
      return existing;
    }

    // Get grade information to determine fee structure
    const grade = await prisma.grade.findUnique({
      where: { id: gradeId },
      select: { name: true },
    });

    const gradeName = grade?.name?.toLowerCase() || '';

    // Return a default fee structure based on grade level without saving to database
    const defaultFeeBreakdown = this.getDefaultFeeBreakdownByGrade(gradeName);
    const totalAmount = Object.values(defaultFeeBreakdown).reduce((sum, amount) => sum + amount, 0);

    return {
      id: `default-${gradeId}-${academicYear}-${term}`,
      schoolId,
      gradeId,
      year: parseInt(academicYear),
      term,
      totalAmount: totalAmount,
      breakdown: defaultFeeBreakdown,
      isActive: true,
      isReleased: true,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: null,
      academicYearId: null,
      termId: null,
    };
  }

  /**
   * Get default fee breakdown based on grade level
   */
  private getDefaultFeeBreakdownByGrade(gradeName: string): Record<string, number> {
    const normalizedGrade = gradeName.toLowerCase().trim();

    // Extract the numeric grade from patterns like "grade 1a", "grade 2a", etc.
    const gradeMatch = normalizedGrade.match(/grade\s*(\d+)/);
    const gradeNumber = gradeMatch ? parseInt(gradeMatch[1]) : null;

    if (gradeNumber !== null) {
      // Grade 1 (lowest fees)
      if (gradeNumber === 1) {
        return {
          tuition: 15000,
          books: 2500,
          uniform: 2000,
          activities: 1000,
          development: 2500,
          lunch: 3000,
        };
      }

      // Grade 2 (slightly higher)
      if (gradeNumber === 2) {
        return {
          tuition: 18000,
          books: 3000,
          uniform: 2500,
          activities: 1500,
          development: 3000,
          lunch: 4000,
        };
      }

      // Grade 3 (medium-low)
      if (gradeNumber === 3) {
        return {
          tuition: 21000,
          books: 3500,
          uniform: 3000,
          activities: 2000,
          development: 3500,
          lunch: 4500,
        };
      }

      // Grade 4 (medium)
      if (gradeNumber === 4) {
        return {
          tuition: 24000,
          books: 4000,
          uniform: 3500,
          activities: 2500,
          development: 4000,
          lunch: 5000,
        };
      }

      // Grade 5 (medium-high)
      if (gradeNumber === 5) {
        return {
          tuition: 27000,
          books: 4500,
          uniform: 4000,
          activities: 3000,
          development: 4500,
          lunch: 5500,
        };
      }

      // Grade 6 (highest primary)
      if (gradeNumber === 6) {
        return {
          tuition: 30000,
          books: 5000,
          uniform: 4500,
          activities: 3500,
          development: 5000,
          lunch: 6000,
          exam: 2000,
        };
      }
    }

    // Fallback patterns for other naming conventions
    if (normalizedGrade.includes('pp1') || normalizedGrade.includes('pre-primary 1') || 
        normalizedGrade.includes('kindergarten') || normalizedGrade.includes('nursery')) {
      return {
        tuition: 12000,
        books: 2000,
        uniform: 1500,
        activities: 800,
        development: 2000,
        lunch: 2500,
      };
    }

    if (normalizedGrade.includes('pp2') || normalizedGrade.includes('pre-primary 2')) {
      return {
        tuition: 14000,
        books: 2200,
        uniform: 1800,
        activities: 1000,
        development: 2200,
        lunch: 2800,
      };
    }

    // Default fallback for unrecognized grades
    return {
      tuition: 25000,
      books: 5000,
      uniform: 3000,
      activities: 2000,
      development: 5000,
      lunch: 5000,
    };
  }

  /**
   * Calculate real-time balance for a student using actual fee structures from database
   */
  async calculateStudentBalance(
    studentId: string, 
    academicYear: string, 
    term: string
  ): Promise<StudentFeeBalance> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
        school: true,
      },
    });

    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // Use the same approach as parent dashboard - fetch fee data from student fees API logic
    try {
      // Get actual fee structure from database (same as parent dashboard)
      const feeStructure = await prisma.termlyFeeStructure.findFirst({
        where: {
          schoolId: student.schoolId,
          gradeId: student.class?.gradeId || '',
          year: parseInt(academicYear),
          term: term,
          isActive: true,
        },
        include: {
          grade: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!feeStructure) {
        // If no fee structure exists, fall back to default
        const defaultStructure = await this.getFeeStructureForGrade(
          student.schoolId,
          student.class?.gradeId || '',
          academicYear,
          term
        );
        
        return this.calculateBalanceFromStructure(studentId, academicYear, term, defaultStructure);
      }

      return this.calculateBalanceFromStructure(studentId, academicYear, term, feeStructure);
    } catch (error) {
      console.error('Error calculating student balance:', error);
      // Fall back to default structure if there's an error
      const defaultStructure = await this.getFeeStructureForGrade(
        student.schoolId,
        student.class?.gradeId || '',
        academicYear,
        term
      );
      
      return this.calculateBalanceFromStructure(studentId, academicYear, term, defaultStructure);
    }
  }

  /**
   * Helper method to calculate balance from a fee structure
   */
  private async calculateBalanceFromStructure(
    studentId: string,
    academicYear: string,
    term: string,
    feeStructure: any
  ): Promise<StudentFeeBalance> {
    // Get all payments for this student, academic year, and term
    const payments = await prisma.payment.findMany({
      where: {
        studentId,
        academicYear: {
          name: academicYear,
        },
        term: {
          name: term,
        },
      },
      include: {
        academicYear: true,
        term: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    // Calculate totals
    const totalRequired = parseFloat(feeStructure.totalAmount.toString());
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const balance = totalRequired - totalPaid;

    // Format payment history
    const paymentHistory: PaymentRecord[] = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod || 'cash',
      receivedBy: payment.receivedBy,
      receiptNumber: payment.receiptNumber,
      referenceNumber: payment.referenceNumber || undefined,
      description: payment.description,
    }));

    return {
      studentId,
      academicYear,
      term,
      totalRequired,
      totalPaid,
      balance,
      lastUpdated: new Date(),
      feeBreakdown: feeStructure.breakdown as Record<string, number>,
      paymentHistory,
    };
  }

  /**
   * Get balances for all students in a school
   */
  async getSchoolStudentBalances(
    schoolId: string,
    academicYear: string,
    term: string,
    gradeId?: string
  ) {
    const whereClause: any = {
      schoolId,
      isActive: true,
      status: 'active',
    };

    if (gradeId) {
      whereClause.class = {
        gradeId,
      };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        class: {
          include: {
            grade: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          class: {
            grade: {
              name: 'asc',
            },
          },
        },
        {
          user: {
            name: 'asc',
          },
        },
      ],
    });

    // Calculate balances for each student
    const studentBalances = await Promise.all(
      students.map(async (student) => {
        const balance = await this.calculateStudentBalance(student.id, academicYear, term);
        
        return {
          id: student.id,
          name: student.user.name,
          admissionNumber: student.admissionNumber,
          email: student.user.email,
          phone: student.user.phone,
          gradeName: student.class?.grade?.name || 'N/A',
          className: student.class?.name || 'N/A',
          academicYear: student.academicYear || parseInt(academicYear),
          parent: student.parent,
          class: student.class,
          feeStructure: {
            id: balance.studentId,
            name: `${term} ${academicYear} Fees`,
            totalAmount: balance.totalRequired,
            breakdown: balance.feeBreakdown,
          },
          totalFeeRequired: balance.totalRequired,
          totalPaid: balance.totalPaid,
          balance: balance.balance,
          lastPayment: balance.paymentHistory[0] || null,
          paymentHistory: balance.paymentHistory,
          lastUpdated: balance.lastUpdated,
        };
      })
    );

    // Calculate summary
    const summary = {
      totalStudents: studentBalances.length,
      totalFeesRequired: studentBalances.reduce((sum, s) => sum + s.totalFeeRequired, 0),
      totalFeesCollected: studentBalances.reduce((sum, s) => sum + s.totalPaid, 0),
      totalOutstanding: studentBalances.reduce((sum, s) => sum + s.balance, 0),
      studentsWithOutstanding: studentBalances.filter(s => s.balance > 0).length,
    };

    return {
      students: studentBalances,
      summary,
    };
  }

  /**
   * Record a new payment and update balances
   */
  async recordPayment(
    studentId: string,
    amount: number,
    academicYear: string,
    term: string,
    paymentMethod: string,
    receivedBy: string,
    description?: string,
    referenceNumber?: string
  ) {
    try {
      // Get student info
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { schoolId: true },
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Get or create academic year
      let academicYearRecord = await prisma.academicYear.findFirst({
        where: {
          schoolId: student.schoolId,
          name: academicYear,
        },
      });

      if (!academicYearRecord) {
        const year = parseInt(academicYear);
        academicYearRecord = await prisma.academicYear.create({
          data: {
            schoolId: student.schoolId,
            name: academicYear,
            startDate: new Date(year, 0, 1),
            endDate: new Date(year, 11, 31),
            isCurrent: year === new Date().getFullYear(),
          },
        });
      }

      // Get or create term
      let termRecord = await prisma.term.findFirst({
        where: {
          academicYearId: academicYearRecord.id,
          name: term,
        },
      });

      if (!termRecord) {
        const termNames = ['FIRST', 'SECOND', 'THIRD'];
        const termIndex = termNames.indexOf(term);
        
        if (termIndex === -1) {
          throw new Error(`Invalid term: ${term}`);
        }

        termRecord = await prisma.term.create({
          data: {
            academicYearId: academicYearRecord.id,
            name: term,
            startDate: new Date(parseInt(academicYear), termIndex * 4, 1),
            endDate: new Date(parseInt(academicYear), (termIndex + 1) * 4 - 1, 30),
            isCurrent: termIndex === 0,
          },
        });
      }

      // Generate receipt and reference numbers
      const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const finalReferenceNumber = referenceNumber || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Get current balance before payment
      const currentBalance = await this.calculateStudentBalance(studentId, academicYear, term);
      const balanceBefore = currentBalance.balance;

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          studentId,
          academicYearId: academicYearRecord.id,
          termId: termRecord.id,
          amount,
          paymentMethod,
          referenceNumber: finalReferenceNumber,
          receiptNumber,
          description: description || `${term} ${academicYear} fee payment`,
          paymentDate: new Date(),
          receivedBy,
        },
      });

      // Calculate updated balance after payment
      const updatedBalance = await this.calculateStudentBalance(studentId, academicYear, term);

      // Create receipt record
      const receipt = await prisma.receipt.create({
        data: {
          paymentId: payment.id,
          studentId,
          receiptNumber,
          amount,
          paymentDate: payment.paymentDate,
          academicYearOutstandingBefore: balanceBefore,
          academicYearOutstandingAfter: updatedBalance.balance,
          termOutstandingBefore: balanceBefore,
          termOutstandingAfter: updatedBalance.balance,
          academicYearId: academicYearRecord.id,
          termId: termRecord.id,
          paymentMethod,
          referenceNumber: finalReferenceNumber,
        },
      });

      return {
        payment,
        receipt,
        updatedBalance,
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  /**
   * Get payment history for a student
   */
  async getPaymentHistory(studentId: string, academicYear?: string, term?: string) {
    const whereClause: any = {
      studentId,
    };

    if (academicYear) {
      whereClause.academicYear = {
        name: academicYear,
      };
    }

    if (term) {
      whereClause.term = {
        name: term,
      };
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        academicYear: {
          select: {
            name: true,
          },
        },
        term: {
          select: {
            name: true,
          },
        },
        receipt: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    return payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod || 'cash',
      receivedBy: payment.receivedBy,
      receiptNumber: payment.receiptNumber,
      referenceNumber: payment.referenceNumber,
      description: payment.description,
      academicYear: payment.academicYear?.name,
      term: payment.term?.name,
      receipt: payment.receipt,
    }));
  }
}

export { FeeBalanceService };
export const feeBalanceService = new FeeBalanceService();
