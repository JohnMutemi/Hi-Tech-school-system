import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string, studentId: string } }) {
  try {
    const { schoolCode, studentId } = params;
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");
    const termId = searchParams.get("termId");

    // Find the student and validate school
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        school: { code: schoolCode },
      },
      include: { school: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Build where clause for filtering
    const where: any = {
      studentId,
    };
    if (academicYearId) where.academicYearId = academicYearId;
    if (termId) where.termId = termId;

    // Fetch receipts for the student
    const receipts = await prisma.receipt.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        term: true,
        academicYear: true,
        payment: {
          include: {
            student: {
              include: {
                user: true,
                class: true
              }
            }
          }
        },
      },
    });

    // Attach school name and flatten term/year info
    const receiptsWithSchool = receipts.map(r => ({
      ...r,
      schoolName: student.school?.name || "",
      term: r.term?.name || r.termId || "",
      academicYear: r.academicYear?.name || r.academicYearId || "",
      termOutstandingBefore: r.termOutstandingBefore,
      termOutstandingAfter: r.termOutstandingAfter,
      academicYearOutstandingBefore: r.academicYearOutstandingBefore,
      academicYearOutstandingAfter: r.academicYearOutstandingAfter,
      paymentMethod: r.payment?.paymentMethod || r.paymentMethod,
      referenceNumber: r.payment?.referenceNumber || r.referenceNumber,
      amount: r.amount,
      paymentDate: r.paymentDate,
      studentName: r.payment?.student?.user?.name || "",
      className: r.payment?.student?.class?.name || "",
      admissionNumber: r.payment?.student?.admissionNumber || "",
    }));

    return NextResponse.json(receiptsWithSchool);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 