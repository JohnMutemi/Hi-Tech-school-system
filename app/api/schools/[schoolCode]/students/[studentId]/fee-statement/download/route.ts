import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Direct download of fee statement PDF for a student
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string; studentId: string } }) {
  try {
    const { schoolCode, studentId } = params;
    const decodedSchoolCode = decodeURIComponent(schoolCode);
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    console.log('🔍 Direct download requested for fee statement:', {
      schoolCode: decodedSchoolCode,
      studentId,
      academicYearId
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

    // Get school details
    const school = await prisma.school.findUnique({ 
      where: { code: decodedSchoolCode },
      select: { name: true, code: true }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Import jsPDF dynamically to avoid SSR issues
    const { jsPDF } = await import('jspdf');
    
    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;

    // Header
    pdf.setFillColor(102, 126, 234); // Blue background
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setTextColor(255, 255, 255); // White text
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    const titleWidth = pdf.getTextWidth(school.name);
    pdf.text(school.name, (pageWidth - titleWidth) / 2, 20);
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    const subtitleWidth = pdf.getTextWidth('Fee Statement');
    pdf.text('Fee Statement', (pageWidth - subtitleWidth) / 2, 30);

    yPosition = 50;

    // Student Information
    pdf.setTextColor(0, 0, 0); // Black text
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Student Information', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const studentInfo = [
      ['Student Name:', statementData.student?.name || 'N/A'],
      ['Admission Number:', statementData.student?.admissionNumber || 'N/A'],
      ['Grade:', statementData.student?.gradeName || 'N/A'],
      ['Class:', statementData.student?.className || 'N/A'],
      ['Academic Year:', statementData.academicYear || 'N/A'],
      ['Parent/Guardian:', statementData.student?.parentName || 'N/A']
    ];

    studentInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, margin + 50, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Statement Table
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Transaction History', margin, yPosition);
    yPosition += 10;

    // Table headers
    const headers = ['No.', 'Ref', 'Date', 'Description', 'Debit (KES)', 'Credit (KES)', 'Balance (KES)'];
    const columnWidths = [15, 25, 30, 60, 25, 25, 25];
    let xPosition = margin;

    pdf.setFillColor(102, 126, 234); // Blue background for headers
    pdf.setTextColor(255, 255, 255); // White text
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');

    headers.forEach((header, index) => {
      pdf.rect(xPosition, yPosition, columnWidths[index], 8, 'F');
      pdf.text(header, xPosition + 2, yPosition + 6);
      xPosition += columnWidths[index];
    });

    yPosition += 8;

    // Table data
    pdf.setTextColor(0, 0, 0); // Black text
    pdf.setFont('helvetica', 'normal');

    (statementData.statement || []).forEach((item: any, index: number) => {
      if (yPosition > 250) { // Check if we need a new page
        pdf.addPage();
        yPosition = 20;
      }

      xPosition = margin;
      const rowData = [
        (item.no || index + 1).toString(),
        item.ref || '-',
        item.date ? new Date(item.date).toLocaleDateString() : '-',
        item.description || '-',
        item.debit ? Number(item.debit).toLocaleString() : '-',
        item.credit ? Number(item.credit).toLocaleString() : '-',
        item.balance ? Number(item.balance).toLocaleString() : '-'
      ];

      rowData.forEach((cell, cellIndex) => {
        pdf.rect(xPosition, yPosition, columnWidths[cellIndex], 8, 'S');
        pdf.text(cell, xPosition + 2, yPosition + 6);
        xPosition += columnWidths[cellIndex];
      });

      yPosition += 8;
    });

    yPosition += 10;

    // Summary
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Financial Summary', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    const summaryItems = [
      ['Total Charges:', `KES ${Number(statementData.summary?.totalDebit || 0).toLocaleString()}`],
      ['Total Payments:', `KES ${Number(statementData.summary?.totalCredit || 0).toLocaleString()}`],
      ['Final Balance:', `KES ${Number(statementData.summary?.finalBalance || 0).toLocaleString()}`]
    ];

    summaryItems.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, margin + 80, yPosition);
      yPosition += 8;
    });

    // Footer
    yPosition = 270;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128); // Gray text
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
    pdf.text(`${school.name} - Fee Statement`, margin, yPosition + 5);

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    const filename = `Fee_Statement_${statementData.student?.name?.replace(/\s+/g, '_') || 'Student'}_${statementData.academicYear || 'Current'}.pdf`;
    
    console.log('✅ PDF generated successfully:', filename);

    // Return PDF as response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating direct download PDF fee statement:', error);
    return NextResponse.json({ error: 'Failed to generate PDF fee statement' }, { status: 500 });
  }
}
