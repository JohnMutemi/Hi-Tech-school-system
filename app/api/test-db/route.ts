import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test basic query
    const schools = await prisma.school.findMany({ take: 1 });
    
    // Test user creation (if needed)
    const testUser = await prisma.user.create({
      data: {
        name: 'Test Teacher',
        email: `test-${Date.now()}@test.com`,
        password: 'test123',
        role: 'TEACHER',
        phone: '+1234567890',
        teacherProfile: {
          create: {
            qualification: 'Test Qualification',
            tempPassword: 'test123'
          }
        }
      },
      include: {
        teacherProfile: true
      }
    });
    
    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection and operations working',
      schoolsCount: schools.length
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 