import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: List all classes for a school
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('gradeId');
    const whereClause: any = { schoolId: school.id };
    if (gradeId) whereClause.gradeId = gradeId;
    const classes = await prisma.class.findMany({ 
      where: whereClause,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        grade: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}

// POST: Create a new class
export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    const body = await request.json();
    const { name, level, academicYear, teacherId, gradeId } = body;
    if (!name || !academicYear || !gradeId) {
      return NextResponse.json({ error: "Missing required fields: name, academicYear, and gradeId are required" }, { status: 400 });
    }
    const newClass = await prisma.class.create({
      data: {
        name,
        academicYear,
        teacherId: teacherId || null,
        schoolId: school.id,
        gradeId: gradeId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        grade: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}

// PUT: Update a class
export async function PUT(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    const body = await request.json();
    const { id, name, academicYear, teacherId, gradeId } = body;
    if (!id) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }
    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name,
        academicYear,
        teacherId: teacherId || null,
        gradeId: gradeId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        grade: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json({ error: "Failed to update class" }, { status: 500 });
  }
}

// DELETE: Delete a class
export async function DELETE(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }
    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 });
  }
} 