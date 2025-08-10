import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; studentId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear");
    const term = searchParams.get("term");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

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
      where: { id: params.studentId },
      include: {
        school: true,
        user: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Build where clause for payments (Payment does not have schoolId field)
    const whereClause: any = {
      studentId: params.studentId,
    };

    // Add academic year filter if provided
    if (academicYear) {
      const academicYearRecord = await prisma.academicYear.findFirst({
        where: {
          schoolId: school.id,
          name: academicYear
        }
      });
      
      if (academicYearRecord) {
        whereClause.academicYearId = academicYearRecord.id;
      }
    }

    // Add term filter if provided
    if (term) {
      const termRecord = await prisma.term.findFirst({
        where: {
          name: term,
          academicYear: {
            schoolId: school.id
          }
        }
      });
      
      if (termRecord) {
        whereClause.termId = termRecord.id;
      }
    }

    // Get payments with pagination
    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        academicYear: true,
        term: true,
        receipt: {
          select: {
            receiptNumber: true,
            amount: true,
            paymentDate: true,
          }
        }
      },
      orderBy: {
        paymentDate: "desc"
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.payment.count({
      where: whereClause,
    });

    // Transform payments to match expected format
    const paymentHistory = payments.map(payment => ({
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      term: payment.term?.name || "N/A",
      academicYear: payment.academicYear?.name || "N/A",
      status: payment.status,
      reference: payment.referenceNumber,
      phoneNumber: payment.phoneNumber,
      transactionId: payment.transactionId,
      description: payment.description,
      carryForwardAmount: payment.carryForwardAmount,
      overpaymentAmount: payment.overpaymentAmount,
      appliedToTerm: payment.appliedToTerm,
      appliedToAcademicYear: payment.appliedToAcademicYear,
    }));

    // Get summary statistics
    const totalPayments = paymentHistory.length;
    const totalAmount = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

    // Get payment method distribution
    const paymentMethodStats = paymentHistory.reduce((acc, payment) => {
      const method = payment.paymentMethod || "Unknown";
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get term-wise payment distribution
    const termStats = paymentHistory.reduce((acc, payment) => {
      const term = payment.term || "Unknown";
      acc[term] = (acc[term] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    // Get academic year-wise payment distribution
    const academicYearStats = paymentHistory.reduce((acc, payment) => {
      const year = payment.academicYear || "Unknown";
      acc[year] = (acc[year] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      payments: paymentHistory,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      summary: {
        totalPayments,
        totalAmount,
        averageAmount,
        paymentMethodStats,
        termStats,
        academicYearStats,
      },
      filters: {
        academicYear: academicYear || null,
        term: term || null,
      }
    });

  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 