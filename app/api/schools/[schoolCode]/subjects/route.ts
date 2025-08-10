import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withSchoolContext } from '@/lib/school-context';

const prisma = new PrismaClient();

// GET: List all subjects for a school
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();
    
    const subjects = await schoolManager.getSubjects();
    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

// POST: Create a new subject
export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    const schoolContext = await schoolManager.initialize();
    
    const body = await request.json();
    const { name, code, description, teacherId } = body;
    
    if (!name || !code) {
      return NextResponse.json({ error: "Missing required fields: name and code are required" }, { status: 400 });
    }
    
    // Check if subject code already exists for this school
    const existingSubject = await prisma.subject.findFirst({
      where: {
        schoolId: schoolContext.schoolId,
        code: code
      }
    });
    
    if (existingSubject) {
      return NextResponse.json({ error: "Subject code already exists for this school" }, { status: 409 });
    }
    
    const newSubject = await prisma.subject.create({
      data: {
        name,
        code,
        description,
        teacherId: teacherId || null,
        schoolId: schoolContext.schoolId,
        isActive: true
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}

// PUT: Update a subject
export async function PUT(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();
    
    const body = await request.json();
    const { id, name, code, description, teacherId } = body;
    
    if (!id) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 });
    }
    
    // Validate that the subject belongs to this school
    const isValidSubject = await schoolManager.validateSchoolOwnership(id, prisma.subject);
    if (!isValidSubject) {
      return NextResponse.json({ error: "Subject not found or access denied" }, { status: 404 });
    }
    
    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: {
        name,
        code,
        description,
        teacherId: teacherId || null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedSubject);
  } catch (error) {
    console.error("Error updating subject:", error);
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 });
  }
}

// DELETE: Delete a subject
export async function DELETE(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolManager = withSchoolContext(params.schoolCode);
    await schoolManager.initialize();
    
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 });
    }
    
    // Validate that the subject belongs to this school
    const isValidSubject = await schoolManager.validateSchoolOwnership(id, prisma.subject);
    if (!isValidSubject) {
      return NextResponse.json({ error: "Subject not found or access denied" }, { status: 404 });
    }
    
    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
  }
} 