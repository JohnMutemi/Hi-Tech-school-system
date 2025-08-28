import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SchoolSeedingService } from '@/lib/services/school-seeding-service';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    
    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    console.log(`🌱 Starting seeding process for school: ${schoolCode}`);

    // Initialize seeding service
    const seedingService = new SchoolSeedingService(school.id, schoolCode);
    
    // Perform comprehensive seeding
    const results = await seedingService.seedSchoolData();

    console.log(`✅ Seeding completed for school: ${schoolCode}`, results);

    return NextResponse.json({
      success: true,
      message: 'School data seeded successfully',
      results
    });

  } catch (error) {
    console.error('Error seeding school data:', error);
    return NextResponse.json(
      { error: 'Failed to seed school data' },
      { status: 500 }
    );
  }
}



