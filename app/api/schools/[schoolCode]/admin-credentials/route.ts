import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();

    // Find the school and its admin user
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
      include: {
        users: {
          where: { role: 'admin' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const adminUser = school.users.find(u => u.role === 'admin');
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // For security reasons, we can't return the actual stored password
    // Instead, we return the admin email and provide helpful information
    return NextResponse.json({
      email: adminUser.email,
      schoolName: school.name,
      schoolCode: school.code,
      message: "Admin credentials retrieved. Please use the admin email and your actual password to login.",
      note: "If you don't remember your password, please contact the system administrator or use the password reset functionality."
    });

  } catch (error) {
    console.error('Error fetching admin credentials:', error);
    return NextResponse.json({ error: 'Failed to fetch admin credentials' }, { status: 500 });
  }
} 