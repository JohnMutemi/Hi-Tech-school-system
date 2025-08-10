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

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const body = await request.json();

    console.log("Creating fee structure for school:", schoolCode);
    console.log("Fee structure data:", body);

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

    // Validate required fields
    const { gradeId, term, totalAmount, breakdown, academicYearId, termId, dueDate } = body;

    if (!gradeId || !totalAmount || !academicYearId || !termId) {
      return NextResponse.json(
        { error: "Missing required fields: gradeId, totalAmount, academicYearId, and termId are required" },
        { status: 400 }
      );
    }

    // Check if grade exists and belongs to the school (or is a platform-level grade)
    const grade = await prisma.grade.findFirst({
      where: {
        id: gradeId,
        OR: [
          { schoolId: school.id }, // School-specific grade
          { schoolId: null }       // Platform-level grade
        ]
      },
    });

    console.log("Grade lookup result:", {
      gradeId,
      schoolId: school.id,
      gradeFound: !!grade,
      gradeName: grade?.name,
      gradeSchoolId: grade?.schoolId
    });

    if (!grade) {
      // Let's also check what grades exist for debugging
      const allGrades = await prisma.grade.findMany({
        where: {
          OR: [
            { schoolId: school.id },
            { schoolId: null }
          ]
        },
        select: { id: true, name: true, schoolId: true }
      });
      
      console.log("Available grades for school:", allGrades);
      
      return NextResponse.json(
        { 
          error: "Grade not found or does not belong to this school",
          debug: {
            requestedGradeId: gradeId,
            schoolId: school.id,
            availableGrades: allGrades
          }
        },
        { status: 404 }
      );
    }

    // Check if academic year exists and belongs to the school
    const academicYear = await prisma.academicYear.findFirst({
      where: {
        id: academicYearId,
        schoolId: school.id,
      },
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: "Academic year not found or does not belong to this school" },
        { status: 404 }
      );
    }

    // Check if term exists and get term information
    const termRecord = await prisma.term.findFirst({
      where: {
        id: termId,
        academicYearId: academicYearId,
      },
    });

    if (!termRecord) {
      return NextResponse.json(
        { error: "Term not found or does not belong to this academic year" },
        { status: 404 }
      );
    }

    // Use the term name from the database if no term is provided in the request
    const termName = term || termRecord.name;

    // Check if fee structure already exists for this combination
    const existingFeeStructure = await prisma.termlyFeeStructure.findFirst({
      where: {
        schoolId: school.id,
        gradeId: gradeId,
        term: termName,
        academicYearId: academicYearId,
        isActive: true,
      },
    });

    if (existingFeeStructure) {
      return NextResponse.json(
        { error: "Fee structure already exists for this grade, term, and academic year" },
        { status: 409 }
      );
    }

    // Find a valid user to use as creator (preferably admin or system user)
    const systemUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: "admin" } },
          { email: { contains: "system" } },
          { role: "ADMIN" }
        ]
      }
    });

    // If no system user found, use the first user available
    const fallbackUser = systemUser || await prisma.user.findFirst();
    
    if (!fallbackUser) {
      return NextResponse.json(
        { error: "No valid user found to create fee structure. Please ensure at least one user exists in the system." },
        { status: 500 }
      );
    }

    console.log("Using creator:", { id: fallbackUser.id, email: fallbackUser.email });

    // Create the fee structure
    const feeStructure = await prisma.termlyFeeStructure.create({
      data: {
        term: termName,
        year: academicYear.startDate.getFullYear(),
        totalAmount: totalAmount,
        breakdown: breakdown || {},
        isActive: true,
        dueDate: dueDate ? new Date(dueDate) : null,
        isReleased: false,
        schoolId: school.id,
        gradeId: gradeId,
        academicYearId: academicYearId,
        termId: termId || null,
        createdBy: fallbackUser.id,
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
    });

    // Log the creation
    await prisma.feeStructureLog.create({
      data: {
        feeStructureId: feeStructure.id,
        action: "CREATED",
        performedBy: fallbackUser.id,
        details: {
          gradeId,
          term: termName,
          totalAmount,
          breakdown,
        },
      },
    });

    console.log("Fee structure created successfully:", feeStructure.id);

    // Transform the response to match expected format
    const response = {
      id: feeStructure.id,
      gradeId: feeStructure.gradeId,
      gradeName: feeStructure.grade?.name,
      term: feeStructure.term,
      year: feeStructure.year,
      amount: parseFloat(feeStructure.totalAmount.toString()),
      totalAmount: parseFloat(feeStructure.totalAmount.toString()),
      dueDate: feeStructure.dueDate?.toISOString().split('T')[0] || "",
      breakdown: feeStructure.breakdown as Record<string, number>,
      academicYear: feeStructure.academicYear?.name || feeStructure.year.toString(),
      academicYearId: feeStructure.academicYearId,
      termId: feeStructure.termId,
      termName: feeStructure.termRef?.name,
      isActive: feeStructure.isActive,
      isReleased: feeStructure.isReleased,
      createdAt: feeStructure.createdAt.toISOString(),
      updatedAt: feeStructure.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Fee structure created successfully",
      feeStructure: response,
    });

  } catch (error) {
    console.error("Error creating fee structure:", error);
    return NextResponse.json(
      { error: "Failed to create fee structure" },
      { status: 500 }
    );
  }
} 