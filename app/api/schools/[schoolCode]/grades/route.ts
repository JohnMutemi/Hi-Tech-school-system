import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withSchoolContext } from '@/lib/school-context';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();
    
    const grades = await schoolManager.getGrades();
    return NextResponse.json(grades);
  } catch (error) {
    console.error("Error fetching grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();
    const schoolContext = schoolManager.getContext();
    
    const body = await request.json();
    const { name } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: "Grade name is required" },
        { status: 400 }
      );
    }
    
    // Check if grade already exists
    const existingGrade = await prisma.grade.findFirst({
      where: {
        name,
        schoolId: schoolContext.schoolId
      }
    });
    
    if (existingGrade) {
      return NextResponse.json(
        { error: "Grade already exists" },
        { status: 409 }
      );
    }
    
    // Create new grade
    const grade = await prisma.grade.create({
      data: {
        name,
        schoolId: schoolContext.schoolId,
        isAlumni: false
      }
    });
    
    return NextResponse.json({ success: true, grade });
  } catch (error) {
    console.error("Error creating grade:", error);
    return NextResponse.json(
      { error: "Failed to create grade" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();
    const schoolContext = schoolManager.getContext();
    
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('id');
    
    if (!gradeId) {
      return NextResponse.json(
        { error: "Grade ID is required" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: "Grade name is required" },
        { status: 400 }
      );
    }
    
    // Check if grade exists and belongs to this school
    const existingGrade = await prisma.grade.findFirst({
      where: {
        id: gradeId,
        schoolId: schoolContext.schoolId
      }
    });
    
    if (!existingGrade) {
      return NextResponse.json(
        { error: "Grade not found" },
        { status: 404 }
      );
    }
    
    // Check if new name already exists (excluding current grade)
    const duplicateGrade = await prisma.grade.findFirst({
      where: {
        name,
        schoolId: schoolContext.schoolId,
        id: { not: gradeId }
      }
    });
    
    if (duplicateGrade) {
      return NextResponse.json(
        { error: "Grade name already exists" },
        { status: 409 }
      );
    }
    
    // Update the grade
    const updatedGrade = await prisma.grade.update({
      where: {
        id: gradeId
      },
      data: {
        name
      }
    });
    
    return NextResponse.json({ success: true, grade: updatedGrade });
  } catch (error) {
    console.error("Error updating grade:", error);
    return NextResponse.json(
      { error: "Failed to update grade" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();
    const schoolContext = schoolManager.getContext();
    
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('id');
    
    if (!gradeId) {
      return NextResponse.json(
        { error: "Grade ID is required" },
        { status: 400 }
      );
    }
    
    // Check if grade exists and belongs to this school
    const grade = await prisma.grade.findFirst({
      where: {
        id: gradeId,
        schoolId: schoolContext.schoolId
      },
      include: {
        classes: true
      }
    });
    
    if (!grade) {
      return NextResponse.json(
        { error: "Grade not found" },
        { status: 404 }
      );
    }
    
    // Check if grade has associated classes
    if (grade.classes.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete grade with associated classes" },
        { status: 400 }
      );
    }
    
    // Delete the grade
    await prisma.grade.delete({
      where: {
        id: gradeId
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting grade:", error);
    return NextResponse.json(
      { error: "Failed to delete grade" },
      { status: 500 }
    );
  }
}
