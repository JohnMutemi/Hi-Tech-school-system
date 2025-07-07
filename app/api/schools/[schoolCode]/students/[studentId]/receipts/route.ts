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
    });

    return NextResponse.json(receipts);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 