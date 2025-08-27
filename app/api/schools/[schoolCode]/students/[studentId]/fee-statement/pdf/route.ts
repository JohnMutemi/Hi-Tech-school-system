import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const prisma = new PrismaClient();

// GET: Generate PDF fee statement for a student
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string; studentId: string } }) {
  try {
    const { schoolCode, studentId } = params;
    const decodedSchoolCode = decodeURIComponent(schoolCode);
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    // Get the fee statement data using the existing logic
    const feeStatementResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/schools/${schoolCode}/students/${studentId}/fee-statement${academicYearId ? `?academicYearId=${academicYearId}` : ''}`,
      { method: 'GET' }
    );

    if (!feeStatementResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch fee statement data' }, { status: 400 });
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

    // Generate PDF
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

    // Fee Statement Table
    yPosition += 10;
    
    const tableColumns = ['No.', 'Ref', 'Date', 'Description', 'Debit (KES)', 'Credit (KES)', 'Balance (KES)'];
    const tableRows = (statementData.statement || []).map((item: any, index: number) => [
      (item.no || index + 1).toString(),
      item.ref || '-',
      item.date ? new Date(item.date).toLocaleDateString() : '-',
      item.description || '-',
      item.debit ? Number(item.debit).toLocaleString() : '-',
      item.credit ? Number(item.credit).toLocaleString() : '-',
      Number(item.balance || 0).toLocaleString()
    ]);

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
        0: { halign: 'center', cellWidth: 15 }, // No.
        1: { halign: 'center', cellWidth: 25 }, // Ref
        2: { halign: 'center', cellWidth: 25 }, // Date
        3: { halign: 'left', cellWidth: 45 }, // Description
        4: { halign: 'right', cellWidth: 25 }, // Debit
        5: { halign: 'right', cellWidth: 25 }, // Credit
        6: { halign: 'right', cellWidth: 25 } // Balance
      }
    });

    // Summary
    const finalY = (pdf as any).lastAutoTable.finalY + 20;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('SUMMARY', 20, finalY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    const summary = statementData.summary || {};
    const summaryInfo = [
      [`Total Charges:`, `KES ${Number(summary.totalDebit || 0).toLocaleString()}`],
      [`Total Payments:`, `KES ${Number(summary.totalCredit || 0).toLocaleString()}`],
      [`Final Balance:`, `KES ${Number(summary.finalBalance || 0).toLocaleString()}`]
    ];

    let summaryY = finalY + 10;
    summaryInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 20, summaryY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 80, summaryY);
      summaryY += 7;
    });

    // Footer
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, pdf.internal.pageSize.height - 15);
    pdf.text(`${school.name} - Fee Statement`, 105, pdf.internal.pageSize.height - 15, { align: 'center' });

    // Generate the PDF buffer
    const pdfBuffer = pdf.output('arraybuffer');
    
    // Create filename
    const filename = `Fee-Statement-${statementData.student.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'Student'}-${statementData.academicYear?.replace(/[^a-zA-Z0-9]/g, '-') || 'Academic-Year'}.pdf`;

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



