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
    
    // Enhanced Header with Green Theme
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 100, 0); // Dark green
    pdf.text(`🏫 ${school.name}`, 105, 20, { align: 'center' });
    
    pdf.setFontSize(18);
    pdf.setTextColor(0, 150, 0); // Medium green
    pdf.text('💳 ENHANCED FEE STATEMENT', 105, 32, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80); // Gray
    pdf.text('Professional Academic Financial Report with Overpayment Tracking', 105, 40, { align: 'center' });
    
    // Reset color for rest of content
    pdf.setTextColor(0, 0, 0);
    
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

    let yPosition = 50;
    
    // Student info section header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 120, 0);
    pdf.text('📊 STUDENT INFORMATION', 20, yPosition);
    yPosition += 10;
    
    // Draw a subtle border around student info
    pdf.setDrawColor(0, 179, 42);
    pdf.setLineWidth(0.5);
    pdf.rect(15, yPosition - 5, 180, (studentInfo.length * 7) + 10);
    
    // Reset colors
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    
    studentInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 20, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 85, yPosition);
      yPosition += 7;
    });
    
    yPosition += 5;

    // Fee Statement Table with improved layout
    yPosition += 10;
    
    const tableColumns = ['No.', 'Ref', 'Date', 'Description', 'Debit (KES)', 'Credit (KES)', 'Term Bal. (KES)', 'Year Bal. (KES)'];
    const tableRows = (statementData.statement || []).map((item: any, index: number) => {
      // Enhanced styling for special rows with overpayment tracking
      if (item.type === 'term-header') {
        return [
          '',
          '',
          '',
          `🏫 ${item.description || ''}`,
          '',
          '',
          '',
          ''
        ];
      } else if (item.type === 'term-closing') {
        const termBalance = Number(item.termBalance || 0);
        const isOverpaid = termBalance < 0;
        const isPaid = termBalance === 0;
        
        let statusIcon;
        if (isOverpaid) {
          statusIcon = '💚';
        } else if (isPaid) {
          statusIcon = '✅';
        } else {
          statusIcon = '⚠️';
        }
        
        return [
          statusIcon,
          '',
          '',
          item.description || '',
          item.debit ? Number(item.debit).toLocaleString() : '-',
          item.credit ? Number(item.credit).toLocaleString() : '-',
          Math.abs(termBalance).toLocaleString(),
          Number(item.academicYearBalance || 0).toLocaleString()
        ];
      } else if (item.type === 'carry-forward') {
        const carryForwardAmount = Number(item.termBalance || 0);
        const isOverpayment = carryForwardAmount < 0;
        const icon = isOverpayment ? '🔄💚' : '🔄⚠️';
        
        return [
          icon,
          item.ref || '-',
          item.date ? new Date(item.date).toLocaleDateString() : '-',
          item.description || '-',
          item.debit ? Number(item.debit).toLocaleString() : '-',
          item.credit ? Number(item.credit).toLocaleString() : '-',
          Math.abs(carryForwardAmount).toLocaleString(),
          Number(item.academicYearBalance || 0).toLocaleString()
        ];
      } else if (item.type === 'brought-forward') {
        const isOverpayment = item.isOverpayment;
        const icon = isOverpayment ? '💚' : '📋';
        
        return [
          icon,
          item.ref || '-',
          item.date ? new Date(item.date).toLocaleDateString() : '-',
          item.description || '-',
          item.debit ? Number(item.debit).toLocaleString() : '-',
          item.credit ? Number(item.credit).toLocaleString() : '-',
          item.termBalance ? Number(item.termBalance).toLocaleString() : '-',
          item.academicYearBalance ? Number(item.academicYearBalance).toLocaleString() : '-'
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
        fillColor: [0, 179, 42], // Safaricom green
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
        // Enhanced styling for special rows with green theme
        const cellText = data.cell.text[0];
        const rowIndex = data.row.index;
        const originalData = statementData.statement[rowIndex];
        
        if (originalData?.type === 'term-header') {
          // Term header - green gradient
          data.cell.styles.fillColor = [0, 179, 42]; // Safaricom green
          data.cell.styles.textColor = [255, 255, 255]; // White text
          data.cell.styles.fontStyle = 'bold';
        } else if (originalData?.type === 'term-closing') {
          // Term closing balance - status-based colors
          const termBalance = Number(originalData.termBalance || 0);
          const isOverpaid = termBalance < 0;
          const isPaid = termBalance === 0;
          
          if (isOverpaid) {
            data.cell.styles.fillColor = [209, 242, 235]; // Light green
            data.cell.styles.textColor = [0, 100, 0]; // Dark green
          } else if (isPaid) {
            data.cell.styles.fillColor = [212, 237, 218]; // Light green
            data.cell.styles.textColor = [21, 87, 36]; // Dark green
          } else {
            data.cell.styles.fillColor = [255, 243, 205]; // Light yellow
            data.cell.styles.textColor = [133, 100, 4]; // Dark yellow
          }
          data.cell.styles.fontStyle = 'bold';
        } else if (originalData?.type === 'brought-forward') {
          // Brought forward row - status-based colors
          const isOverpayment = originalData.isOverpayment;
          if (isOverpayment) {
            data.cell.styles.fillColor = [209, 242, 235]; // Light green
            data.cell.styles.textColor = [0, 120, 0]; // Dark green
          } else {
            data.cell.styles.fillColor = [255, 243, 205]; // Light yellow
            data.cell.styles.textColor = [133, 100, 4]; // Dark yellow
          }
          data.cell.styles.fontStyle = 'bold';
        } else if (originalData?.type === 'carry-forward') {
          // Carry forward row - green theme with status indicators
          const carryForwardAmount = Number(originalData.termBalance || 0);
          const isOverpayment = carryForwardAmount < 0;
          
          if (isOverpayment) {
            data.cell.styles.fillColor = [209, 242, 235]; // Light green
            data.cell.styles.textColor = [0, 120, 0]; // Dark green
          } else {
            data.cell.styles.fillColor = [255, 243, 205]; // Light yellow
            data.cell.styles.textColor = [133, 100, 4]; // Dark yellow
          }
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
    pdf.setTextColor(0, 120, 0); // Dark green
    pdf.text('💰 ENHANCED FINANCIAL SUMMARY', 20, finalY);
    pdf.setTextColor(0, 0, 0); // Reset to black
    
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
    pdf.setTextColor(100, 100, 100); // Gray
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, footerY);
    pdf.text(`${school.name} - Enhanced Fee Statement with Overpayment Tracking`, 105, footerY, { align: 'center' });
    pdf.setTextColor(0, 0, 0); // Reset to black

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



