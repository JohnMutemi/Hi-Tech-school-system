interface EnhancedFeeStatementData {
  schoolName: string
  schoolCode: string
  student: {
    name: string
    admissionNumber: string
    gradeName: string
    className: string
    parentName?: string
  }
  academicYear: string
  statement: Array<{
    no: string | number
    ref: string
    date: string
    description: string
    debit: number
    credit: number
    balance?: number
    type?: string
    termBalance?: number
    academicYearBalance?: number
    isOverpayment?: boolean
    carryForwardAmount?: number
  }>
  summary: {
    totalDebit: number
    totalCredit: number
    finalBalance: number
    totalPayments: number
    totalCharges: number
  }
}

export async function generateEnhancedFeeStatementPDF(data: EnhancedFeeStatementData, size: 'A3' | 'A4' | 'A5' = 'A4'): Promise<Buffer> {
  // Import jsPDF dynamically to avoid SSR issues
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  
  // Define paper sizes in mm for jsPDF
  const paperSizes = {
    A3: { width: 297, height: 420 },
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 }
  }
  
  const currentSize = paperSizes[size]
  
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'KES 0';
    }
    return `KES ${amount.toLocaleString()}`;
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Create PDF with specified size
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: size.toLowerCase() as any
  })

  // Enhanced Header with Green Theme
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 100, 0); // Dark green
  pdf.text(`🏫 ${data.schoolName}`, currentSize.width / 2, 20, { align: 'center' });
  
  pdf.setFontSize(18);
  pdf.setTextColor(0, 150, 0); // Medium green
  pdf.text('💳 ENHANCED FEE STATEMENT', currentSize.width / 2, 32, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80); // Gray
  pdf.text('Professional Academic Financial Report with Overpayment Tracking', currentSize.width / 2, 40, { align: 'center' });
  
  // Reset color for rest of content
  pdf.setTextColor(0, 0, 0);
  
  // Student Information Section
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const studentInfo = [
    [`Student Name:`, data.student.name || 'N/A'],
    [`Admission Number:`, data.student.admissionNumber || 'N/A'],
    [`Grade:`, data.student.gradeName || 'N/A'],
    [`Class:`, data.student.className || 'N/A'],
    [`Academic Year:`, data.academicYear || 'N/A'],
    [`Parent/Guardian:`, data.student.parentName || 'N/A'],
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
  pdf.rect(15, yPosition - 5, currentSize.width - 30, (studentInfo.length * 7) + 10);
  
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
  
  yPosition += 15;

  // Fee Statement Table
  const tableColumns = ['No.', 'Ref', 'Date', 'Description', 'Debit (KES)', 'Credit (KES)', 'Term Bal. (KES)', 'Year Bal. (KES)'];
  const tableRows = (data.statement || []).map((item: any, index: number) => {
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
        item.ref || 'BALANCE',
        formatDate(item.date),
        item.description || '',
        item.debit ? Number(item.debit).toLocaleString() : '-',
        item.credit ? Number(item.credit).toLocaleString() : '-',
        formatCurrency(Math.abs(termBalance)),
        item.academicYearBalance ? Number(item.academicYearBalance).toLocaleString() : '-'
      ];
    } else if (item.type === 'brought-forward') {
      const isOverpayment = item.isOverpayment;
      const icon = isOverpayment ? '💚' : '📋';
      
      return [
        icon,
        item.ref || 'B/F',
        formatDate(item.date),
        item.description || '',
        item.debit ? Number(item.debit).toLocaleString() : '-',
        item.credit ? Number(item.credit).toLocaleString() : '-',
        item.termBalance ? formatCurrency(Number(item.termBalance)) : '-',
        item.academicYearBalance ? Number(item.academicYearBalance).toLocaleString() : '-'
      ];
    } else if (item.type === 'carry-forward') {
      const carryForwardAmount = Number(item.termBalance || 0);
      const isOverpayment = carryForwardAmount < 0;
      const icon = isOverpayment ? '🔄💚' : '🔄⚠️';
      
      return [
        icon,
        item.ref || 'C/F',
        formatDate(item.date),
        item.description || '',
        item.debit ? Number(item.debit).toLocaleString() : '-',
        item.credit ? Number(item.credit).toLocaleString() : '-',
        formatCurrency(Math.abs(carryForwardAmount)),
        item.academicYearBalance ? Number(item.academicYearBalance).toLocaleString() : '-'
      ];
    } else {
      return [
        item.no || (index + 1),
        item.ref || '-',
        formatDate(item.date),
        item.description || '-',
        item.debit ? Number(item.debit).toLocaleString() : '-',
        item.credit ? Number(item.credit).toLocaleString() : '-',
        item.termBalance ? formatCurrency(Number(item.termBalance)) : '-',
        item.academicYearBalance ? Number(item.academicYearBalance).toLocaleString() : '-'
      ];
    }
  });

  // Create the table with enhanced styling
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
      fontSize: size === 'A5' ? 7 : (size === 'A3' ? 11 : 9),
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: size === 'A5' ? 12 : (size === 'A3' ? 20 : 15) }, // No.
      1: { cellWidth: size === 'A5' ? 18 : (size === 'A3' ? 25 : 20) }, // Ref
      2: { cellWidth: size === 'A5' ? 20 : (size === 'A3' ? 25 : 22) }, // Date
      3: { cellWidth: size === 'A5' ? 35 : (size === 'A3' ? 70 : 50) }, // Description
      4: { cellWidth: size === 'A5' ? 18 : (size === 'A3' ? 25 : 22), halign: 'right' }, // Debit
      5: { cellWidth: size === 'A5' ? 18 : (size === 'A3' ? 25 : 22), halign: 'right' }, // Credit
      6: { cellWidth: size === 'A5' ? 18 : (size === 'A3' ? 25 : 22), halign: 'right' }, // Term Bal
      7: { cellWidth: size === 'A5' ? 18 : (size === 'A3' ? 25 : 22), halign: 'right' }  // Year Bal
    },
    didParseCell: function(data) {
      const originalData = data.row.index >= 0 ? tableRows[data.row.index] : null;
      
      if (originalData && typeof originalData === 'object') {
        // Style term headers
        if (originalData[3]?.includes('🏫')) {
          data.cell.styles.fillColor = [0, 179, 42]; // Green
          data.cell.styles.textColor = [255, 255, 255]; // White
          data.cell.styles.fontStyle = 'bold';
        }
        // Style carry-forward rows
        else if (originalData[0]?.includes('🔄')) {
          const isOverpayment = originalData[0]?.includes('💚');
          if (isOverpayment) {
            data.cell.styles.fillColor = [209, 242, 235]; // Light green
            data.cell.styles.textColor = [0, 120, 0]; // Dark green
          } else {
            data.cell.styles.fillColor = [255, 243, 205]; // Light yellow
            data.cell.styles.textColor = [133, 100, 4]; // Dark yellow
          }
          data.cell.styles.fontStyle = 'bold';
        }
        // Style term closing rows
        else if (originalData[0]?.includes('💚') || originalData[0]?.includes('✅') || originalData[0]?.includes('⚠️')) {
          const isOverpaid = originalData[0]?.includes('💚');
          const isPaid = originalData[0]?.includes('✅');
          
          if (isOverpaid) {
            data.cell.styles.fillColor = [209, 242, 235]; // Light green
            data.cell.styles.textColor = [0, 120, 0]; // Dark green
          } else if (isPaid) {
            data.cell.styles.fillColor = [220, 247, 195]; // Very light green
            data.cell.styles.textColor = [0, 120, 0]; // Dark green
          } else {
            data.cell.styles.fillColor = [255, 243, 205]; // Light yellow
            data.cell.styles.textColor = [133, 100, 4]; // Dark yellow
          }
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // Summary Section
  let finalY = (pdf as any).lastAutoTable.finalY + 15;
  const pageHeight = currentSize.height;
  
  // Check if we need a new page for the summary
  if (finalY + 60 > pageHeight - 30) {
    pdf.addPage();
    finalY = 30;
  }
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 120, 0); // Dark green
  pdf.text('💰 ENHANCED FINANCIAL SUMMARY', 20, finalY);
  pdf.setTextColor(0, 0, 0); // Reset to black
  
  // Summary Details
  let summaryY = finalY + 20;
  const summary = data.summary || {};
  const summaryInfo = [
    [`Total Charges:`, formatCurrency(Number(summary.totalDebit || 0))],
    [`Total Payments:`, formatCurrency(Number(summary.totalCredit || 0))],
    [`Final Balance:`, formatCurrency(Number(summary.finalBalance || 0))]
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
  const currentPageHeight = currentSize.height;
  
  // If footer would be too close to content or bottom, add spacing
  let footerY = Math.max(summaryY, currentPageHeight - 30);
  if (footerY - summaryY < 10) {
    footerY = summaryY + 15;
  }
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 100, 100); // Gray
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, footerY);
  pdf.text(`${data.schoolName} - Enhanced Fee Statement with Overpayment Tracking`, currentSize.width / 2, footerY, { align: 'center' });
  pdf.setTextColor(0, 0, 0); // Reset to black

  // Return PDF as Buffer (same as receipt pattern)
  return Buffer.from(pdf.output('arraybuffer'))
}

