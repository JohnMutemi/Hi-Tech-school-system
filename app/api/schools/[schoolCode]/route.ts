import { PrismaClient } from '@prisma/client';
import { type NextRequest, NextResponse } from "next/server";
import { z } from 'zod';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const school = await prisma.school.findFirst({
    where: {
      code: {
        equals: params.schoolCode,
        mode: 'insensitive',
      },
    },
  });
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 });
  }

  if (action === 'current-academic-year') {
    const year = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, isCurrent: true },
      include: { terms: true },
    });
    return NextResponse.json(year);
  }
  if (action === 'current-term') {
    const year = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, isCurrent: true },
      include: { terms: { where: { isCurrent: true } } },
    });
    return NextResponse.json(year?.terms?.[0] || null);
  }

  try {
    const schoolCode = params.schoolCode;

    const schoolData = await prisma.school.findFirst({
      where: {
        code: {
          equals: schoolCode,
          mode: 'insensitive',
        },
      },
      include: {
        users: {
          where: { role: 'admin' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
          }
        },
        students: {
          select: {
            id: true,
            admissionNumber: true,
            isActive: true,
            createdAt: true
          }
        },
        classes: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    if (!schoolData) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Transform data to match SchoolData interface
    const transformedSchool = {
      id: schoolData.id,
      schoolCode: schoolData.code,
      name: schoolData.name,
      logo: schoolData.logo,
      colorTheme: "#3b82f6", // Default theme
      portalUrl: `/schools/${schoolData.code}`,
      description: "",
      adminEmail: schoolData.users.find(u => u.role === 'admin')?.email || schoolData.email,
      adminPassword: "", // Don't return password
      adminFirstName: schoolData.users.find(u => u.role === 'admin')?.name?.split(' ')[0] || "Admin",
      adminLastName: schoolData.users.find(u => u.role === 'admin')?.name?.split(' ').slice(1).join(' ') || "User",
      createdAt: schoolData.createdAt.toISOString(),
      status: schoolData.isActive ? "active" : "suspended",
      profile: {
        address: schoolData.address,
        phone: schoolData.phone,
        website: "",
        principalName: "",
        establishedYear: new Date().getFullYear().toString(),
        description: "",
        email: schoolData.email,
        motto: "",
        type: "primary" as const
      },
      teachers: [],
      students: schoolData.students.map(s => ({
        id: s.id,
        name: "",
        email: "",
        phone: "",
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        admissionNumber: s.admissionNumber,
        class: "",
        dateOfBirth: "",
        gender: "male" as const,
        address: "",
        dateAdmitted: (s as any).createdAt?.toISOString() || new Date().toISOString(),
        status: s.isActive ? "active" : "inactive"
      })),
      subjects: [],
      classes: schoolData.classes.map(c => ({
        id: c.id,
        name: c.name,
        level: "",
        capacity: 30,
        currentStudents: 0,
        classTeacherId: "",
        subjects: []
      })),
      // Add admission number settings
      admissionNumberFormat: schoolData.admissionNumberFormat || '{SCHOOL_CODE}-{YEAR}-{SEQ}',
      lastAdmissionNumber: schoolData.lastAdmissionNumber || '',
      admissionNumberAutoIncrement: schoolData.admissionNumberAutoIncrement ?? true,
    };

    return NextResponse.json(transformedSchool);
  } catch (error) {
    console.error("Error fetching school:", error);
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode;
    const body = await request.json();
    
    const {
      name,
      address,
      phone,
      email,
      adminEmail,
      adminFirstName,
      adminLastName,
      description,
      colorTheme,
      status,
      profile
    } = body;

    // Find the school
    const school = await prisma.school.findFirst({
      where: {
        code: {
          equals: schoolCode,
          mode: 'insensitive',
        },
      },
      include: {
        users: {
          where: { role: 'admin' }
        }
      }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Update school
    const updatedSchool = await prisma.school.update({
      where: { code: schoolCode },
      data: {
        name: name || school.name,
        address: address || school.address,
        phone: phone || school.phone,
        email: email || school.email,
        isActive: status !== 'suspended',
        ...(body.lastAdmissionNumber !== undefined && { lastAdmissionNumber: body.lastAdmissionNumber })
      }
    });

    // Update admin user if provided
    if (adminEmail && school.users[0]) {
      await prisma.user.update({
        where: { id: school.users[0].id },
        data: {
          name: `${adminFirstName || 'Admin'} ${adminLastName || 'User'}`,
          email: adminEmail
        }
      });
    }

    // Return updated school
    const result = await prisma.school.findFirst({
      where: {
        code: {
          equals: schoolCode,
          mode: 'insensitive',
        },
      },
      include: {
        users: {
          where: { role: 'admin' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    if (!result) {
      return NextResponse.json({ error: 'Failed to retrieve updated school' }, { status: 500 });
    }

    const transformedSchool = {
      id: result.id,
      schoolCode: result.code,
      name: result.name,
      logo: result.logo,
      colorTheme: colorTheme || "#3b82f6",
      portalUrl: `/schools/${result.code}`,
      description: description || "",
      adminEmail: result.users.find(u => u.role === 'admin')?.email || result.email,
      adminPassword: "",
      adminFirstName: result.users.find(u => u.role === 'admin')?.name?.split(' ')[0] || "Admin",
      adminLastName: result.users.find(u => u.role === 'admin')?.name?.split(' ').slice(1).join(' ') || "User",
      createdAt: result.createdAt.toISOString(),
      status: result.isActive ? "active" : "suspended",
      profile: {
        address: result.address,
        phone: result.phone,
        website: profile?.website || "",
        principalName: profile?.principalName || "",
        establishedYear: profile?.establishedYear || new Date().getFullYear().toString(),
        description: profile?.description || "",
        email: result.email,
        motto: profile?.motto || "",
        type: profile?.type || "primary"
      },
      teachers: [],
      students: [],
      subjects: [],
      classes: []
    };

    return NextResponse.json(transformedSchool);
  } catch (error) {
    console.error("Error updating school:", error);
    return NextResponse.json({ error: "Failed to update school" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode;

    // Check if school exists
    const school = await prisma.school.findFirst({
      where: {
        code: {
          equals: schoolCode,
          mode: 'insensitive',
        },
      },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Delete school (this will cascade delete related records)
    await prisma.school.delete({
      where: { code: schoolCode },
    });

    return NextResponse.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error("Error deleting school:", error);
    return NextResponse.json({ error: "Failed to delete school" }, { status: 500 });
  }
}

// POST: Set current academic year or term
export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const body = await req.json();

  const school = await prisma.school.findFirst({
    where: {
      code: {
        equals: params.schoolCode,
        mode: 'insensitive',
      },
    },
  });
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 });
  }

  if (action === 'set-current-academic-year') {
    const { academicYearId } = body;
    // Set all years to not current, then set the selected one to current
    await prisma.academicYear.updateMany({
      where: { schoolId: school.id },
      data: { isCurrent: false },
    });
    const updated = await prisma.academicYear.update({
      where: { id: academicYearId },
      data: { isCurrent: true },
    });
    return NextResponse.json(updated);
  }
  if (action === 'set-current-term') {
    const { termId } = body;
    // Find the academic year for this term
    const term = await prisma.term.findUnique({ where: { id: termId } });
    if (!term) return NextResponse.json({ error: 'Term not found' }, { status: 404 });
    await prisma.term.updateMany({
      where: { academicYearId: term.academicYearId },
      data: { isCurrent: false },
    });
    const updated = await prisma.term.update({
      where: { id: termId },
      data: { isCurrent: true },
    });
    return NextResponse.json(updated);
  }

  // ... existing code ...
}

// Academic Year CRUD
export async function academicYearsHandler(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const school = await prisma.school.findFirst({
    where: { code: params.schoolCode, },
    // @ts-ignore
    mode: 'insensitive',
  });
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });
  const method = req.method;
  if (method === 'GET') {
    const years = await prisma.academicYear.findMany({ where: { schoolId: school.id }, include: { terms: true } });
    return NextResponse.json(years);
  }
  if (method === 'POST') {
    const body = await req.json();
    const created = await prisma.academicYear.create({ data: { ...body, schoolId: school.id } });
    return NextResponse.json(created);
  }
  if (method === 'PUT') {
    const body = await req.json();
    const updated = await prisma.academicYear.update({ where: { id: body.id }, data: body });
    return NextResponse.json(updated);
  }
  if (method === 'DELETE') {
    const body = await req.json();
    await prisma.academicYear.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Invalid method' }, { status: 405 });
}

// Term CRUD
export async function termsHandler(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const school = await prisma.school.findFirst({
    where: { code: params.schoolCode, },
    // @ts-ignore
    mode: 'insensitive',
  });
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });
  const method = req.method;
  const yearId = new URL(req.url).searchParams.get('yearId');
  if (method === 'GET') {
    if (!yearId) return NextResponse.json({ error: 'Missing yearId' }, { status: 400 });
    const terms = await prisma.term.findMany({ where: { academicYearId: yearId } });
    return NextResponse.json(terms);
  }
  if (method === 'POST') {
    const body = await req.json();
    const created = await prisma.term.create({ data: body });
    return NextResponse.json(created);
  }
  if (method === 'PUT') {
    const body = await req.json();
    const updated = await prisma.term.update({ where: { id: body.id }, data: body });
    return NextResponse.json(updated);
  }
  if (method === 'DELETE') {
    const body = await req.json();
    await prisma.term.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Invalid method' }, { status: 405 });
} 