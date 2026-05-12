import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSchoolContext } from '@/lib/school-context';
import { DEFAULT_GRADE_NAMES } from "@/lib/default-school-structure";

async function assertTeacherFreeForClass(
  schoolId: string,
  teacherId: string | null | undefined,
  excludeClassId?: string | null
) {
  if (!teacherId) return;
  const other = await prisma.class.findFirst({
    where: {
      schoolId,
      teacherId,
      ...(excludeClassId ? { id: { not: excludeClassId } } : {}),
    },
    select: { id: true, name: true },
  });
  if (other) {
    throw Object.assign(new Error("This teacher is already assigned as class teacher to another class."), {
      status: 409,
    });
  }
}

// GET: List all classes for a school
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    const schoolContext = await schoolManager.initialize();

    // Auto-heal default Grade 1-9 class set so student onboarding
    // and fee structure grade selectors always have a complete baseline.
    for (const gradeName of DEFAULT_GRADE_NAMES) {
      let grade = await prisma.grade.findFirst({
        where: {
          schoolId: schoolContext.schoolId,
          name: gradeName,
        },
      });

      if (!grade) {
        const platformGrade = await prisma.grade.findFirst({
          where: {
            schoolId: null,
            name: gradeName,
          },
        });
        grade =
          platformGrade ||
          (await prisma.grade.create({
            data: {
              schoolId: schoolContext.schoolId,
              name: gradeName,
              isAlumni: false,
            },
          }));
      }

      const existingClass = await prisma.class.findFirst({
        where: {
          schoolId: schoolContext.schoolId,
          name: gradeName,
        },
        select: { id: true },
      });

      if (!existingClass) {
        await prisma.class.create({
          data: {
            schoolId: schoolContext.schoolId,
            gradeId: grade.id,
            name: gradeName,
            isActive: true,
          },
        });
      }
    }
    
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('gradeId');
    
    const whereClause: Record<string, unknown> = schoolManager.getSchoolWhereClause();
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

    const classesWithCount = classes.map(cls => ({
      ...cls,
      currentStudents: cls.students.length,
      students: undefined
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
    const { name, teacherId, gradeId, shortCode } = body;
    if (!name || !gradeId) {
      return NextResponse.json({ error: "Missing required fields: name and gradeId are required" }, { status: 400 });
    }

    const codeTrim = typeof shortCode === "string" ? shortCode.trim() : "";
    if (codeTrim) {
      const dupCode = await prisma.class.findFirst({
        where: {
          schoolId: schoolContext.schoolId,
          shortCode: { equals: codeTrim, mode: "insensitive" },
        },
      });
      if (dupCode) {
        return NextResponse.json({ error: "Short code already used by another class in this school." }, { status: 409 });
      }
    }

    try {
      await assertTeacherFreeForClass(schoolContext.schoolId, teacherId, null);
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      if (err.status === 409) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      throw e;
    }
    
    if (name && String(name).trim().toLowerCase() === "alumni") {
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
      data: {
        name: String(name).trim(),
        gradeId,
        schoolId: schoolContext.schoolId,
        isActive: true,
        ...(teacherId ? { teacherId: String(teacherId) } : {}),
        ...(codeTrim ? { shortCode: codeTrim } : {}),
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
    
    const classWithCount = {
      ...newClass,
      currentStudents: newClass.students.length,
      students: undefined
    };
    
    return NextResponse.json(classWithCount, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating class:", error);
    const code = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : "";
    if (code === "P2002") {
      return NextResponse.json(
        { error: "A class with this name or short code already exists in this school." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}

// PUT: Update a class
export async function PUT(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    const schoolContext = await schoolManager.initialize();
    
    const body = await request.json();
    const { id, name, teacherId, gradeId, shortCode } = body;
    if (!id) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }
    
    const isValidClass = await schoolManager.validateSchoolOwnership(id, prisma.class);
    if (!isValidClass) {
      return NextResponse.json({ error: "Class not found or access denied" }, { status: 404 });
    }

    const codeTrim =
      typeof shortCode === "string" ? shortCode.trim() : "";
    const shortCodeProvided = shortCode !== undefined;
    if (codeTrim) {
      const dupCode = await prisma.class.findFirst({
        where: {
          schoolId: schoolContext.schoolId,
          shortCode: { equals: codeTrim, mode: "insensitive" },
          id: { not: id },
        },
      });
      if (dupCode) {
        return NextResponse.json({ error: "Short code already used by another class in this school." }, { status: 409 });
      }
    }

    try {
      await assertTeacherFreeForClass(schoolContext.schoolId, teacherId, id);
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      if (err.status === 409) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      throw e;
    }

    const shortCodeUpdate =
      !shortCodeProvided
        ? {}
        : codeTrim
          ? { shortCode: codeTrim }
          : { shortCode: null };
    
    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name: name != null ? String(name).trim() : undefined,
        teacherId: teacherId === undefined ? undefined : teacherId || null,
        gradeId: gradeId || undefined,
        ...shortCodeUpdate,
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
  } catch (error: unknown) {
    console.error("Error updating class:", error);
    const code = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : "";
    if (code === "P2002") {
      return NextResponse.json(
        { error: "A class with this name or short code already exists in this school." },
        { status: 409 }
      );
    }
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
