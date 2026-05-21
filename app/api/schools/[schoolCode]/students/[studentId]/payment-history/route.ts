import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireRole, requireSchoolAccess } from "@/lib/api-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; studentId: string } }
) {
  try {
    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ["super_admin", "school_admin", "bursar", "parent", "student"]);

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear");
    const term = searchParams.get("term");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const student = await prisma.student.findFirst({
      where: {
        id: params.studentId,
        schoolId: schoolContext.schoolId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const whereClause: {
      studentId: string;
      academicYearId?: string;
      termId?: string;
    } = {
      studentId: params.studentId,
    };

    if (academicYear) {
      const academicYearRecord = await prisma.academicYear.findFirst({
        where: {
          schoolId: schoolContext.schoolId,
          name: academicYear,
        },
      });

      if (academicYearRecord) {
        whereClause.academicYearId = academicYearRecord.id;
      }
    }

    if (term) {
      const termRecord = await prisma.term.findFirst({
        where: {
          name: term,
          academicYear: {
            schoolId: schoolContext.schoolId,
          },
        },
      });

      if (termRecord) {
        whereClause.termId = termRecord.id;
      }
    }

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
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.payment.count({
      where: whereClause,
    });

    const paymentHistory = payments.map((payment) => ({
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

    const totalPayments = paymentHistory.length;
    const totalAmount = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

    const paymentMethodStats = paymentHistory.reduce(
      (acc, payment) => {
        const method = payment.paymentMethod || "Unknown";
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const termStats = paymentHistory.reduce(
      (acc, payment) => {
        const termName = payment.term || "Unknown";
        acc[termName] = (acc[termName] || 0) + payment.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const academicYearStats = paymentHistory.reduce(
      (acc, payment) => {
        const year = payment.academicYear || "Unknown";
        acc[year] = (acc[year] || 0) + payment.amount;
        return acc;
      },
      {} as Record<string, number>
    );

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
      },
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return jsonError(error);
  }
}
