import { PrismaClient } from '@prisma/client';
import { type NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
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

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Transform data to match SchoolData interface
    const transformedSchool = {
      id: school.id,
      schoolCode: school.code,
      name: school.name,
      logo: school.logo,
      colorTheme: "#3b82f6", // Default theme
      portalUrl: `/schools/${school.code}`,
      description: "",
      adminEmail: school.users.find(u => u.role === 'admin')?.email || school.email,
      adminPassword: "", // Don't return password
      adminFirstName: school.users.find(u => u.role === 'admin')?.name?.split(' ')[0] || "Admin",
      adminLastName: school.users.find(u => u.role === 'admin')?.name?.split(' ').slice(1).join(' ') || "User",
      createdAt: school.createdAt.toISOString(),
      status: school.isActive ? "active" : "suspended",
      profile: {
        address: school.address,
        phone: school.phone,
        website: "",
        principalName: "",
        establishedYear: new Date().getFullYear().toString(),
        description: "",
        email: school.email,
        motto: "",
        type: "primary" as const
      },
      teachers: [],
      students: school.students.map(s => ({
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
      classes: school.classes.map(c => ({
        id: c.id,
        name: c.name,
        level: "",
        capacity: 30,
        currentStudents: 0,
        classTeacherId: "",
        subjects: []
      }))
    };

    return NextResponse.json(transformedSchool);
  } catch (error) {
    console.error("Error fetching school:", error);
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();
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
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
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
        isActive: status !== 'suspended'
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
    const result = await prisma.school.findUnique({
      where: { code: schoolCode },
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
    const schoolCode = params.schoolCode.toLowerCase();

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Delete school (this will cascade delete related records)
    await prisma.school.delete({
      where: { code: schoolCode }
    });

    return NextResponse.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error("Error deleting school:", error);
    return NextResponse.json({ error: "Failed to delete school" }, { status: 500 });
  }
} 