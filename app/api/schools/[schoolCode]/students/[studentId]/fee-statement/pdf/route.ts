import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Generate PDF fee statement for a student
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string; studentId: string } }) {
  try {
    const { schoolCode, studentId } = params;
    const decodedSchoolCode = decodeURIComponent(schoolCode);
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    // Get the fee statement data directly instead of using internal fetch
    console.log('🔍 Generating fee statement data directly...');
    
    // Import and call the fee statement logic directly
    const { GET: getFeeStatement } = await import('../route');
    const feeStatementRequest = new NextRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yoursite.com'}/api/schools/${schoolCode}/students/${studentId}/fee-statement${academicYearId ? `?academicYearId=${academicYearId}` : ''}`,
      { method: 'GET' }
    );
    
    const feeStatementResponse = await getFeeStatement(feeStatementRequest, { params: { schoolCode, studentId } });
    
    if (!feeStatementResponse.ok) {
      console.error('❌ Fee statement generation failed');
      return NextResponse.json({ 
        error: 'Failed to generate fee statement data'
      }, { status: 400 });
    }

    const statementData = await feeStatementResponse.json();
    console.log('✅ Fee statement data received:', {
      studentName: statementData.student?.name,
      academicYear: statementData.academicYear,
      statementCount: statementData.statement?.length || 0
    });

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
    console.log('📄 Starting PDF generation...');
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
    
    const tableColumns = ['No.', 'Ref', 'Date', 'Description', 'Debit (KES)', 'Credit (KES)', 'Term Bal. (KES)', 'Year Bal. (KES)'];
    const tableRows = (statementData.statement || []).map((item: any, index: number) => {
      // Style special rows differently
      if (item.type === 'term-header') {
        return [
          '',
          '',
          '',
          item.description || '',
          '',
          '',
          '',
          ''
        ];
      } else if (item.type === 'term-closing') {
        return [
          '',
          '',
          '',
          item.description || '',
          '',
          '',
          Number(item.termBalance || 0).toLocaleString(),
          Number(item.academicYearBalance || 0).toLocaleString()
        ];
      } else {
        return [
          (item.no || '').toString(),
          item.ref || '-',
          item.date ? new Date(item.date).toLocaleDateString() : '-',
          item.description || '-',
          item.debit ? Number(item.debit).toLocaleString() : '-',
          item.credit ? Number(item.credit).toLocaleString() : '-',
          item.termBalance ? Number(item.termBalance).toLocaleString() : '-',
          item.academicYearBalance ? Number(item.academicYearBalance).toLocaleString() : '-'
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
        3: { halign: 'left', cellWidth: 40 }, // Description
        4: { halign: 'right', cellWidth: 22 }, // Debit
        5: { halign: 'right', cellWidth: 22 }, // Credit
        6: { halign: 'right', cellWidth: 22 }, // Term Balance
        7: { halign: 'right', cellWidth: 22 } // Academic Year Balance
      },
      didParseCell: function(data: any) {
        // Style term headers and closing balances differently
        const cellText = data.cell.text[0];
        if (cellText && cellText.includes('===')) {
          // Term header
          data.cell.styles.fillColor = [52, 152, 219]; // Blue background
          data.cell.styles.textColor = [255, 255, 255]; // White text
          data.cell.styles.fontStyle = 'bold';
        } else if (cellText && cellText.includes('TERM') && cellText.includes('BALANCE')) {
          // Term closing balance
          data.cell.styles.fillColor = [241, 196, 15]; // Yellow background
          data.cell.styles.textColor = [0, 0, 0]; // Black text
          data.cell.styles.fontStyle = 'bold';
        } else if (cellText && cellText.includes('BROUGHT FORWARD')) {
          // Brought forward row
          data.cell.styles.fillColor = [231, 76, 60]; // Red background
          data.cell.styles.textColor = [255, 255, 255]; // White text
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // Enhanced Summary with Term and Academic Year Breakdown
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
    pdf.text(`KES ${Number(statementData.summary?.finalAcademicYearBalance || 0).toLocaleString()}`, 130, summaryY);
    
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

    // Footer - ensure proper spacing from content
    summaryY += 20;
    const currentPage = pdf.internal.getCurrentPageInfo().pageNumber;
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
    console.log('📄 Generating PDF buffer...');
    const pdfBuffer = pdf.output('arraybuffer');
    
    // Create filename
    const filename = `Fee-Statement-${statementData.student.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'Student'}-${statementData.academicYear?.replace(/[^a-zA-Z0-9]/g, '-') || 'Academic-Year'}.pdf`;
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
    console.error('Error generating PDF fee statement:', error);
    return NextResponse.json({ error: 'Failed to generate PDF fee statement' }, { status: 500 });
  }
}



