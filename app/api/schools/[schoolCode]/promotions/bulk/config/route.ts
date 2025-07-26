import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  console.log('🔍 GET /api/schools/[schoolCode]/promotions/bulk/config called');
  console.log('📋 Params:', params);
  console.log('🔗 URL:', request.url);
  
  try {
    console.log('🔄 Getting bulk promotion config for school:', params.schoolCode);
    
    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode }
    });

    if (!school) {
      console.log('❌ School not found:', params.schoolCode);
      return NextResponse.json(
        {
          success: false,
          error: 'School not found'
        },
        { status: 404 }
      );
    }

    console.log('✅ School found:', school.name);

    // Get all criteria for the school
    const criteria = await prisma.promotionCriteria.findMany({
      where: { 
        schoolId: school.id,
        promotionType: "bulk"
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${criteria.length} criteria for school`);

    // If no criteria exist, create a default one
    if (criteria.length === 0) {
      console.log('⚠️ No criteria found, creating default configuration...');
      const defaultConfig = await prisma.promotionCriteria.create({
        data: {
          schoolId: school.id,
          name: "Default Criteria",
          description: "Standard promotion criteria",
          minGrade: 50.0,
          maxFeeBalance: 0.0,
          maxDisciplinaryCases: 0,
          isActive: true,
          promotionType: "bulk"
        }
      });
      console.log('✅ Default config created:', defaultConfig);
      return NextResponse.json({
        success: true,
        data: defaultConfig
      });
    }

    // Return the most recent active criteria, or the first one if none are active
    const activeCriteria = criteria.find(c => c.isActive) || criteria[0];
    console.log('✅ Returning criteria:', activeCriteria);

    return NextResponse.json({
      success: true,
      data: activeCriteria
    });
  } catch (error) {
    console.error('❌ Error getting bulk promotion config:', error);
    if (error instanceof Error && error.message.includes('does not exist')) {
      throw new Error('PromotionCriteria table does not exist. Please run the database migration first.');
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bulk promotion config'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  console.log('🔍 POST /api/schools/[schoolCode]/promotions/bulk/config called');
  console.log('📋 Params:', params);
  console.log('🔗 URL:', request.url);
  
  try {
    const body = await request.json();
    console.log('📦 Request body:', body);
    
    const { name, description, minGrade, maxFeeBalance, maxDisciplinaryCases, isActive = true } = body;

    if (typeof minGrade !== 'number' || typeof maxFeeBalance !== 'number' || typeof maxDisciplinaryCases !== 'number') {
      console.log('❌ Validation failed: criteria values must be numbers');
      return NextResponse.json(
        {
          success: false,
          error: 'All criteria values must be numbers'
        },
        { status: 400 }
      );
    }

    const school = await prisma.school.findUnique({
      where: { code: params.schoolCode }
    });

    if (!school) {
      console.log('❌ School not found:', params.schoolCode);
      return NextResponse.json(
        {
          success: false,
          error: 'School not found'
        },
        { status: 404 }
      );
    }

    // If this is set as active, deactivate all other criteria
    if (isActive) {
      await prisma.promotionCriteria.updateMany({
        where: { 
          schoolId: school.id,
          promotionType: "bulk"
        },
        data: { isActive: false }
      });
    }
    
    console.log('🔄 Creating new bulk promotion config with criteria:', {
      name,
      description,
      minGrade,
      maxFeeBalance,
      maxDisciplinaryCases,
      isActive
    });
    
    const config = await prisma.promotionCriteria.create({
      data: {
        schoolId: school.id,
        name: name || "New Criteria",
        description: description || "",
        minGrade,
        maxFeeBalance,
        maxDisciplinaryCases,
        isActive,
        promotionType: "bulk"
      }
    });
    
    console.log('✅ Config created:', config);

    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('❌ Error creating bulk promotion config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bulk promotion config'
      },
      { status: 500 }
    );
  }
} 