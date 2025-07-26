import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { schoolCode: string; criteriaId: string } }
) {
  console.log('🔍 PUT /api/schools/[schoolCode]/promotions/bulk/config/[criteriaId] called');
  console.log('📋 Params:', params);
  
  try {
    const body = await request.json();
    console.log('📦 Request body:', body);
    
    const { name, description, minGrade, maxFeeBalance, maxDisciplinaryCases, isActive } = body;

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

    // Check if criteria exists and belongs to this school
    const existingCriteria = await prisma.promotionCriteria.findFirst({
      where: {
        id: params.criteriaId,
        schoolId: school.id,
        promotionType: "bulk"
      }
    });

    if (!existingCriteria) {
      console.log('❌ Criteria not found:', params.criteriaId);
      return NextResponse.json(
        {
          success: false,
          error: 'Criteria not found'
        },
        { status: 404 }
      );
    }

    // If this is set as active, deactivate all other criteria
    if (isActive) {
      await prisma.promotionCriteria.updateMany({
        where: { 
          schoolId: school.id,
          promotionType: "bulk",
          id: { not: params.criteriaId }
        },
        data: { isActive: false }
      });
    }
    
    console.log('🔄 Updating criteria:', params.criteriaId);
    
    const updatedCriteria = await prisma.promotionCriteria.update({
      where: { id: params.criteriaId },
      data: {
        name: name || existingCriteria.name,
        description: description || existingCriteria.description,
        minGrade,
        maxFeeBalance,
        maxDisciplinaryCases,
        isActive: isActive !== undefined ? isActive : existingCriteria.isActive
      }
    });
    
    console.log('✅ Criteria updated:', updatedCriteria);

    return NextResponse.json({
      success: true,
      data: updatedCriteria
    });
  } catch (error) {
    console.error('❌ Error updating criteria:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update criteria'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { schoolCode: string; criteriaId: string } }
) {
  console.log('🔍 DELETE /api/schools/[schoolCode]/promotions/bulk/config/[criteriaId] called');
  console.log('📋 Params:', params);
  
  try {
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

    // Check if criteria exists and belongs to this school
    const existingCriteria = await prisma.promotionCriteria.findFirst({
      where: {
        id: params.criteriaId,
        schoolId: school.id,
        promotionType: "bulk"
      }
    });

    if (!existingCriteria) {
      console.log('❌ Criteria not found:', params.criteriaId);
      return NextResponse.json(
        {
          success: false,
          error: 'Criteria not found'
        },
        { status: 404 }
      );
    }

    // Check if this is the only active criteria
    if (existingCriteria.isActive) {
      const activeCriteriaCount = await prisma.promotionCriteria.count({
        where: {
          schoolId: school.id,
          promotionType: "bulk",
          isActive: true
        }
      });

      if (activeCriteriaCount <= 1) {
        console.log('❌ Cannot delete the only active criteria');
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot delete the only active criteria. Please activate another criteria first.'
          },
          { status: 400 }
        );
      }
    }
    
    console.log('🔄 Deleting criteria:', params.criteriaId);
    
    await prisma.promotionCriteria.delete({
      where: { id: params.criteriaId }
    });
    
    console.log('✅ Criteria deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Criteria deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting criteria:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete criteria'
      },
      { status: 500 }
    );
  }
} 