import { NextRequest, NextResponse } from 'next/server';
import { executeBulkPromotion } from '@/lib/services/bulk-promotion-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const body = await request.json();
    const { selectedStudents, criteria, promotedBy } = body;

    if (!selectedStudents || !Array.isArray(selectedStudents)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Selected students array is required'
        },
        { status: 400 }
      );
    }

    if (!criteria) {
      return NextResponse.json(
        {
          success: false,
          error: 'Promotion criteria is required'
        },
        { status: 400 }
      );
    }

    if (!promotedBy) {
      return NextResponse.json(
        {
          success: false,
          error: 'Promoted by user ID is required'
        },
        { status: 400 }
      );
    }

    const result = await executeBulkPromotion(
      params.schoolCode,
      selectedStudents,
      criteria,
      promotedBy
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error executing bulk promotion:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute bulk promotion'
      },
      { status: 500 }
    );
  }
} 