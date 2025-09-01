import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { generateEnhancedFeeStatementPDF } from '@/lib/utils/enhanced-fee-statement-generator';

const prisma = new PrismaClient();

// GET: Direct download of fee statement PDF for a student (matching receipt pattern)
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string; studentId: string } }) {
  try {
    const { schoolCode, studentId } = params;
    const decodedSchoolCode = decodeURIComponent(schoolCode);
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const size = searchParams.get('size') || 'A4'; // Default to A4

    console.log('🔍 Direct download requested for fee statement:', {
      schoolCode: decodedSchoolCode,
      studentId,
      academicYearId,
      size
    });

    // Get the fee statement data directly
    const { GET: getFeeStatement } = await import('../route');
    const feeStatementRequest = new NextRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yoursite.com'}/api/schools/${schoolCode}/students/${studentId}/fee-statement${academicYearId ? `?academicYearId=${academicYearId}` : ''}`,
      { method: 'GET' }
    );
    
    const feeStatementResponse = await getFeeStatement(feeStatementRequest, { params: { schoolCode, studentId } });
    
    if (!feeStatementResponse.ok) {
      console.error('❌ Fee statement generation failed for direct download');
      return NextResponse.json({ 
        error: 'Failed to generate fee statement data'
      }, { status: 400 });
    }

    const statementData = await feeStatementResponse.json();
    
    console.log('📊 Statement data received:', {
      hasStatement: !!statementData.statement,
      statementLength: statementData.statement?.length || 0,
      hasSummary: !!statementData.summary,
      student: statementData.student?.name || 'Unknown'
    });

    // Validate statement data
    if (!statementData || !statementData.statement) {
      console.error('❌ Invalid statement data received');
      return NextResponse.json({ 
        error: 'Invalid fee statement data'
      }, { status: 400 });
    }

    // Get school details
    const school = await prisma.school.findUnique({ 
      where: { code: decodedSchoolCode },
      select: { name: true, code: true }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Add school name to statement data
    const enhancedStatementData = {
      ...statementData,
      schoolName: school.name,
      schoolCode: school.code
    };

    console.log('Generating PDF with data:', JSON.stringify({
      student: enhancedStatementData.student?.name,
      academicYear: enhancedStatementData.academicYear,
      statementLength: enhancedStatementData.statement?.length,
      summaryTotal: enhancedStatementData.summary?.finalBalance
    }, null, 2));

    // Generate enhanced PDF fee statement with specified size (same format as receipt)
    const pdfBuffer = await generateEnhancedFeeStatementPDF(enhancedStatementData, size as 'A3' | 'A4' | 'A5');

    // Create filename with size (same pattern as receipt)
    const filename = `Fee-Statement-${statementData.student.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'Student'}-${statementData.academicYear?.replace(/[^a-zA-Z0-9]/g, '-') || 'Academic-Year'}-${size}.pdf`;
    console.log('✅ PDF generated successfully for direct download:', filename);

    // Return PDF as download (exactly matching receipt download pattern)
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading fee statement:', error);
    return NextResponse.json(
      { error: 'Failed to download fee statement' },
      { status: 500 }
    );
  }
}