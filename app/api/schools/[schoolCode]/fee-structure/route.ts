import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get("gradeId"); 
    const academicYear = searchParams.get("academicYear");
    const academicYearId = searchParams.get("academicYearId");
    const termId = searchParams.get("termId");

    // Find the school first
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // If no filters provided, return all fee structures for the school
    if (!gradeId && !academicYear && !academicYearId) {
      console.log("Fetching ALL fee structures for school:", schoolCode);
      
      const allFeeStructures = await prisma.termlyFeeStructure.findMany({
        where: {
          schoolId: school.id,
          isActive: true,
        },
        include: {
          grade: {
            select: {
              id: true,
              name: true,
            },
          },
          academicYear: {
            select: {
              id: true,
              name: true,
            },
          },
          termRef: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { year: "desc" },
          { grade: { name: "asc" } },
          { term: "asc" },
        ],
      });

      console.log(`Found ${allFeeStructures.length} fee structures for school ${schoolCode}`);

      // Transform the data to match expected format
      const feeStructures = allFeeStructures.map((structure) => ({
        id: structure.id,
        gradeId: structure.gradeId,
        gradeName: structure.grade?.name,
        term: structure.term,
        year: structure.year,
        amount: parseFloat(structure.totalAmount.toString()),
        totalAmount: parseFloat(structure.totalAmount.toString()), // Add totalAmount for component compatibility
        dueDate: structure.dueDate?.toISOString().split('T')[0] || "",
        breakdown: structure.breakdown as Record<string, number>,
        academicYear: structure.academicYear?.name || structure.year.toString(),
        academicYearId: structure.academicYearId,
        termId: structure.termId,
        termName: structure.termRef?.name,
        isActive: structure.isActive,
        isReleased: structure.isReleased,
        createdAt: structure.createdAt.toISOString(),
        updatedAt: structure.updatedAt.toISOString(),
      }));

      return NextResponse.json({
        success: true,
        data: feeStructures,
        total: feeStructures.length,
      });
    }

    // Original logic for specific grade and academic year
    console.log("Fee structure query params:", { schoolCode, gradeId, academicYear });

    // First, get the academic year record to get the ID
    const academicYearRecord = await prisma.academicYear.findFirst({
      where: {
        schoolId: school.id,
        name: academicYear!,
      },
    });

    if (!academicYearRecord) {
      console.log("No academic year found for:", { schoolCode, academicYear });
      return NextResponse.json(
        { error: "Academic year not found" },
        { status: 404 }
      );
    }

    console.log("Found academic year:", academicYearRecord.id);

    // Fetch fee structure for the specified grade and academic year
    const feeStructure = (await prisma.termlyFeeStructure.findMany({
      where: {
        schoolId: school.id,
        gradeId: gradeId!,
        academicYearId: academicYearRecord.id,
        isActive: true,
      },
      include: {
        grade: {
          select: {
            name: true,
          },
        },
        academicYear: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        term: "asc",
      },
    })) as Prisma.TermlyFeeStructureGetPayload<{
      include: {
        grade: { select: { name: true } },
        academicYear: { select: { name: true } },
      }
    }>[];

    if (feeStructure.length === 0) {
      return NextResponse.json(
        { error: "No fee structure found for the specified grade and academic year" },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format
    const terms = feeStructure.map((structure) => ({
      id: structure.id,
      term: structure.term,
      amount: parseFloat(structure.totalAmount.toString()),
      dueDate: structure.dueDate?.toISOString().split('T')[0] || "",
      status: "Outstanding", // This would be calculated based on payment status
      breakdown: structure.breakdown as Record<string, number>,
      gradeName: structure.grade?.name,
      academicYear: structure.academicYear?.name || academicYear,
    }));

    return NextResponse.json({
      terms,
      gradeName: feeStructure[0]?.grade?.name,
      academicYear,
      totalTerms: terms.length,
    });
  } catch (error) {
    console.error("Error fetching fee structure:", error);
    return NextResponse.json(
      { error: "Failed to fetch fee structure" },
      { status: 500 }
    );
  }
} 