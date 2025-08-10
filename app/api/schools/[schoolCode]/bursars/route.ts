import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { hashDefaultPasswordByRole } from '@/lib/utils/default-passwords';

const prisma = new PrismaClient();

// GET: Get all bursars for a school
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ 
      where: { code: params.schoolCode.toLowerCase() } 
    });
    
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const bursars = await prisma.user.findMany({
      where: {
        role: 'bursar',
        schoolId: school.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(bursars);
  } catch (error) {
    console.error('Error fetching bursars:', error);
    return NextResponse.json({ error: 'Failed to fetch bursars' }, { status: 500 });
  }
}

// POST: Create a new bursar
export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ 
      where: { code: params.schoolCode.toLowerCase() } 
    });
    
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, tempPassword } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if bursar already exists
    const existingBursar = await prisma.user.findFirst({
      where: {
        email: email,
        role: 'bursar',
        schoolId: school.id
      }
    });

    if (existingBursar) {
      return NextResponse.json({ error: 'Bursar with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await hashDefaultPasswordByRole('bursar');

    const newBursar = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'bursar',
        isActive: true,
        schoolId: school.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      ...newBursar,
      tempPassword: 'bursar123' // Return the default password for display to admin
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating bursar:', error);
    return NextResponse.json({ error: 'Failed to create bursar' }, { status: 500 });
  }
}

// PUT: Update a bursar
export async function PUT(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ 
      where: { code: params.schoolCode.toLowerCase() } 
    });
    
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, email, phone } = body;

    if (!id) {
      return NextResponse.json({ error: 'Bursar ID is required' }, { status: 400 });
    }

    // Verify the bursar belongs to this school
    const existingBursar = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'bursar',
        schoolId: school.id
      }
    });

    if (!existingBursar) {
      return NextResponse.json({ error: 'Bursar not found' }, { status: 404 });
    }

    const updatedBursar = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedBursar);
  } catch (error) {
    console.error('Error updating bursar:', error);
    return NextResponse.json({ error: 'Failed to update bursar' }, { status: 500 });
  }
}

// DELETE: Delete a bursar
export async function DELETE(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ 
      where: { code: params.schoolCode.toLowerCase() } 
    });
    
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Bursar ID is required' }, { status: 400 });
    }

    // Verify the bursar belongs to this school
    const bursar = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'bursar',
        schoolId: school.id
      }
    });

    if (!bursar) {
      return NextResponse.json({ error: 'Bursar not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: 'Bursar deleted successfully' });
  } catch (error) {
    console.error('Error deleting bursar:', error);
    return NextResponse.json({ error: 'Failed to delete bursar' }, { status: 500 });
  }
} 