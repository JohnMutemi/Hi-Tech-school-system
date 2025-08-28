import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withSchoolContext } from '@/lib/school-context';

const prisma = new PrismaClient();

// GET: List all classes for a school
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();
    
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('gradeId');
    
    const whereClause: any = schoolManager.getSchoolWhereClause();
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
        },
        students: {
          where: {
            isActive: true,
            status: {
              not: 'graduated'
            }
          },
          select: {
            id: true
          }
        }
      }
    });

    // Add student count to each class
    const classesWithCount = classes.map(cls => ({
      ...cls,
      currentStudents: cls.students.length,
      students: undefined // Remove the actual students array for cleaner response
    }));
    return NextResponse.json(classesWithCount);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}

// POST: Create a new class
export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    const schoolContext = await schoolManager.initialize();
    
    const body = await request.json();
    const { name, teacherId, gradeId } = body;
    if (!name || !gradeId) {
      return NextResponse.json({ error: "Missing required fields: name and gradeId are required" }, { status: 400 });
    }
    
    const data: any = {
      name,
      gradeId,
      schoolId: schoolContext.schoolId, // Use school context
      isActive: true,
    };
    if (teacherId) data.teacherId = teacherId;
    
    // Prevent duplicate ALUMNI class creation
    if (name && name.trim().toLowerCase() === "alumni") {
      const existingAlumni = await prisma.class.findFirst({
        where: {
          schoolId: schoolContext.schoolId,
          name: { equals: "ALUMNI", mode: "insensitive" },
        },
      });
      if (existingAlumni) {
        return NextResponse.json({ error: "ALUMNI class already exists for this year." }, { status: 409 });
      }
    }
    
    const newClass = await prisma.class.create({
      data,
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
        },
        students: {
          where: {
            isActive: true,
            status: {
              not: 'graduated'
            }
          },
          select: {
            id: true
          }
        }
      }
    });
    
    // Add student count and clean up response
    const classWithCount = {
      ...newClass,
      currentStudents: newClass.students.length,
      students: undefined
    };
    
    return NextResponse.json(classWithCount, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}

// PUT: Update a class
export async function PUT(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();
    
    const body = await request.json();
    const { id, name, teacherId, gradeId } = body;
    if (!id) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }
    
    // Validate that the class belongs to this school
    const isValidClass = await schoolManager.validateSchoolOwnership(id, prisma.class);
    if (!isValidClass) {
      return NextResponse.json({ error: "Class not found or access denied" }, { status: 404 });
    }
    
    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name,
        teacherId: teacherId || null,
        gradeId: gradeId,
        isActive: true,
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
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();
    
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }
    
    // Validate that the class belongs to this school
    const isValidClass = await schoolManager.validateSchoolOwnership(id, prisma.class);
    if (!isValidClass) {
      return NextResponse.json({ error: "Class not found or access denied" }, { status: 404 });
    }
    
    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 });
  }
} 