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
    const autoTable = (await import('jspdf-autotable')).default;

    // Generate PDF
    console.log('📄 Starting PDF generation for direct download...');
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(school.name, 105, 20, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.text('FEE STATEMENT', 105, 30, { align: 'center' });
    
    // Student Information
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const studentInfo = [
      [`Student Name:`, statementData.student.name || 'N/A'],
      [`Admission Number:`, statementData.student.admissionNumber || 'N/A'],
      [`Grade:`, statementData.student.gradeName || 'N/A'],
      [`Class:`, statementData.student.className || 'N/A'],
      [`Academic Year:`, statementData.academicYear || 'N/A'],
      [`Parent/Guardian:`, statementData.student.parentName || 'N/A'],
    ];

    let yPosition = 45;
    studentInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 20, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 80, yPosition);
      yPosition += 7;
    });

    // Fee Statement Table with improved layout
    yPosition += 10;
    
    const tableColumns = ['No.', 'Ref', 'Date', 'Description', 'Debit (KES)', 'Credit (KES)', 'Balance (KES)'];
    const tableRows = (statementData.statement || []).map((item: any, index: number) => {
      // Handle different types of rows
      if (item.type === 'term-header') {
        return [
          '',
          '',
          '',
          `=== ${item.description || item.termName?.toUpperCase()} ===`,
          '',
          '',
          ''
        ];
      } else if (item.type === 'term-closing') {
        return [
          '',
          '',
          '',
          `TERM ${item.termName?.toUpperCase()} BALANCE`,
          '',
          '',
          Number(item.termBalance || 0).toLocaleString()
        ];
      } else {
        return [
          (item.no || index + 1).toString(),
          item.ref || '-',
          item.date ? new Date(item.date).toLocaleDateString() : '-',
          item.description || '-',
          item.debit ? Number(item.debit).toLocaleString() : '-',
          item.credit ? Number(item.credit).toLocaleString() : '-',
          item.balance ? Number(item.balance).toLocaleString() : '-'
        ];
      }
    });

    autoTable(pdf, {
      head: [tableColumns],
      body: tableRows,
      startY: yPosition,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 }, // No.
        1: { halign: 'center', cellWidth: 20 }, // Ref
        2: { halign: 'center', cellWidth: 20 }, // Date
        3: { halign: 'left', cellWidth: 50 }, // Description
        4: { halign: 'right', cellWidth: 25 }, // Debit
        5: { halign: 'right', cellWidth: 25 }, // Credit
        6: { halign: 'right', cellWidth: 25 } // Balance
      },
      didParseCell: function(data: any) {
        // Style term headers and closing balances differently
        const cellText = data.cell.text[0];
        if (cellText && cellText.includes('===')) {
          // Term header - make it stand out with blue background
          data.cell.styles.fillColor = [52, 152, 219]; // Blue background
          data.cell.styles.textColor = [255, 255, 255]; // White text
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 10;
        } else if (cellText && cellText.includes('TERM') && cellText.includes('BALANCE')) {
          // Term closing balance - make it stand out with yellow background
          data.cell.styles.fillColor = [241, 196, 15]; // Yellow background
          data.cell.styles.textColor = [0, 0, 0]; // Black text
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 10;
        } else if (cellText && cellText.includes('BROUGHT FORWARD')) {
          // Brought forward row - make it stand out with red background
          data.cell.styles.fillColor = [231, 76, 60]; // Red background
          data.cell.styles.textColor = [255, 255, 255]; // White text
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // Summary Section
    let finalY = (pdf as any).lastAutoTable.finalY + 15;
    const pageHeight = pdf.internal.pageSize.height;
    
    // Calculate required space for summary section
    let requiredSpace = 60; // Base space for headers
    if (statementData.termBalances && statementData.termBalances.length > 0) {
      requiredSpace += (statementData.termBalances.length * 12) + 20; // Term balances
    }
    requiredSpace += 70; // Summary details and footer
    
    // Check if we need a new page for the summary
    if (finalY + requiredSpace > pageHeight - 30) {
      pdf.addPage();
      finalY = 30;
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('FINANCIAL SUMMARY', 20, finalY);
    
    // Academic Year Summary
    let summaryY = finalY + 20;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Academic Year Balance:', 20, summaryY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`KES ${Number(statementData.summary?.finalBalance || 0).toLocaleString()}`, 130, summaryY);
    
    // Term Balances Summary
    if (statementData.termBalances && statementData.termBalances.length > 0) {
      summaryY += 20;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Term Balances:', 20, summaryY);
      
      statementData.termBalances.forEach((termBalance: any, index: number) => {
        summaryY += 12;
        
        // Check if we need a new page for term balances
        if (summaryY > pageHeight - 50) {
          pdf.addPage();
          summaryY = 30;
          pdf.setFont('helvetica', 'bold');
          pdf.text('Term Balances (Continued):', 20, summaryY);
          summaryY += 15;
        }
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${termBalance.termName} ${termBalance.academicYearName}:`, 30, summaryY);
        pdf.text(`KES ${Number(termBalance.balance || 0).toLocaleString()}`, 130, summaryY);
      });
    }
    
    // Overall Summary Details
    summaryY += 20;
    
    // Check if we need a new page for summary details
    if (summaryY + 50 > pageHeight - 30) {
      pdf.addPage();
      summaryY = 30;
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Summary Details:', 20, summaryY);
    
    summaryY += 15;
    const summary = statementData.summary || {};
    const summaryInfo = [
      [`Total Charges:`, `KES ${Number(summary.totalDebit || 0).toLocaleString()}`],
      [`Total Payments:`, `KES ${Number(summary.totalCredit || 0).toLocaleString()}`],
      [`Final Balance:`, `KES ${Number(summary.finalBalance || 0).toLocaleString()}`]
    ];

    summaryInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 20, summaryY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 80, summaryY);
      summaryY += 10;
    });

    // Footer
    summaryY += 20;
    const currentPageHeight = pdf.internal.pageSize.height;
    
    // If footer would be too close to content or bottom, add spacing
    let footerY = Math.max(summaryY, currentPageHeight - 30);
    if (footerY - summaryY < 10) {
      footerY = summaryY + 15;
    }
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, footerY);
    pdf.text(`${school.name} - Fee Statement`, 105, footerY, { align: 'center' });

    // Generate the PDF buffer
    console.log('📄 Generating PDF buffer for direct download...');
    const pdfBuffer = pdf.output('arraybuffer');
    
    // Create filename
    const filename = `Fee-Statement-${statementData.student.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'Student'}-${statementData.academicYear?.replace(/[^a-zA-Z0-9]/g, '-') || 'Academic-Year'}.pdf`;
    console.log('✅ PDF generated successfully for direct download:', filename);

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
