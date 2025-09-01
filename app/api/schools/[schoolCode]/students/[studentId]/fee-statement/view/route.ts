import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: View fee statement for a student (HTML page with download options)
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

    // Create base URL for downloads
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const pdfDownloadUrl = `${baseUrl}/api/schools/${schoolCode}/students/${studentId}/fee-statement/download${academicYearId ? `?academicYearId=${academicYearId}` : ''}`;

    // Create HTML page that replicates the exact bursar dashboard fee statement experience
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fee Statement - ${statementData.student.name} | ${school.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: rgba(0, 0, 0, 0.5);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #00b32a 0%, #007a20 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M0,0 Q50,30 100,0 L100,100 L0,100 Z" fill="rgba(255,255,255,0.1)"/></svg>');
            background-size: cover;
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
        }
        
        .header h2 {
            font-size: 1.5em;
            font-weight: 400;
            opacity: 0.9;
        }
        
        .download-section {
            background: #f8f9ff;
            padding: 20px 30px;
            border-bottom: 2px solid #eee;
            text-align: center;
        }
        
        .modal-header {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-bottom: 1px solid #e2e8f0;
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .download-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .download-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 500;
            border: 1px solid;
            border-radius: 6px;
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .btn-primary {
            background: white;
            border-color: #059669;
            color: #047857;
        }
        
        .btn-primary:hover {
            background: #d1fae5;
            color: #065f46;
        }
        
        .btn-print {
            background: white;
            border-color: #f59e0b;
            color: #d97706;
        }
        
        .btn-print:hover {
            background: #fef3c7;
            color: #b45309;
        }
        
        .content {
            padding: 30px;
        }
        
        .student-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #e8f8f5 0%, #d4edda 100%);
            border-radius: 15px;
            border-left: 5px solid #00b32a;
            box-shadow: 0 4px 15px rgba(0, 179, 42, 0.1);
            position: relative;
        }
        
        .student-info::before {
            content: '📊';
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 24px;
            opacity: 0.7;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .info-label {
            font-weight: 600;
            color: #555;
        }
        
        .info-value {
            color: #333;
        }
        
        .statement-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .statement-table th {
            background: linear-gradient(135deg, #00b32a 0%, #007a20 100%);
            color: white;
            padding: 15px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            position: relative;
        }
        
        .statement-table th::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: rgba(255,255,255,0.3);
        }
        
        .statement-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
        }
        
        .statement-table tbody tr:nth-child(even) {
            background: #f8f9ff;
        }
        
        .statement-table tbody tr:hover {
            background: #e8f2ff;
            transform: scale(1.01);
            transition: all 0.2s ease;
        }
        
        .amount {
            text-align: right;
            font-weight: 600;
        }
        
        .debit {
            color: #dc3545;
        }
        
        .credit {
            color: #28a745;
        }
        
        .summary {
            margin-top: 30px;
            padding: 25px;
            background: linear-gradient(135deg, #e8f8f5 0%, #d1f2eb 100%);
            border-radius: 15px;
            border: 2px solid #00b32a;
            box-shadow: 0 8px 25px rgba(0, 179, 42, 0.15);
            position: relative;
        }
        
        .summary::before {
            content: '💰';
            position: absolute;
            top: 20px;
            right: 25px;
            font-size: 28px;
            opacity: 0.7;
        }
        
        .summary h3 {
            color: #007a20;
            margin-bottom: 15px;
            font-size: 1.4em;
            font-weight: 700;
        }
        
        .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 16px;
        }
        
        .summary-item.total {
            border-top: 2px solid #00b32a;
            margin-top: 10px;
            padding-top: 15px;
            font-weight: 700;
            font-size: 18px;
            background: rgba(0, 179, 42, 0.1);
            border-radius: 8px;
            padding: 15px 10px;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9ff;
            color: #666;
            font-size: 14px;
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 10px;
            }
            
            .header {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .content {
                padding: 20px;
            }
            
            .student-info {
                grid-template-columns: 1fr;
            }
            
            .statement-table th,
            .statement-table td {
                padding: 8px 5px;
                font-size: 12px;
            }
            
            .download-btn {
                display: block;
                margin: 10px 0;
                text-align: center;
            }
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .download-section {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>🏫 ${school.name}</h1>
                <h2>💳 Fee Statement Portal</h2>
                <p style="margin-top: 10px; opacity: 0.9; font-size: 14px;">Professional Academic Financial Report</p>
            </div>
        </div>
        
        <!-- Header with download button (like receipt view) -->
        <div class="modal-header">
            <div class="modal-title">
                📊 Fee Statement
            </div>
            <div class="download-actions">
                <a href="${pdfDownloadUrl}&size=A3" class="download-btn btn-primary" download>
                    📄 A3 PDF
                </a>
                <a href="${pdfDownloadUrl}&size=A4" class="download-btn btn-primary" download>
                    📄 A4 PDF
                </a>
                <a href="${pdfDownloadUrl}&size=A5" class="download-btn btn-primary" download>
                    📄 A5 PDF
                </a>
                <a href="#" class="download-btn btn-print" onclick="window.print(); return false;">
                    🖨️ Print
                </a>
            </div>
        </div>
        
        <div class="content">
            <div class="student-info">
                <div class="info-item">
                    <span class="info-label">Student Name:</span>
                    <span class="info-value">${statementData.student.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Admission Number:</span>
                    <span class="info-value">${statementData.student.admissionNumber || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Grade:</span>
                    <span class="info-value">${statementData.student.gradeName || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Class:</span>
                    <span class="info-value">${statementData.student.className || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Academic Year:</span>
                    <span class="info-value">${statementData.academicYear || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Parent/Guardian:</span>
                    <span class="info-value">${statementData.student.parentName || 'N/A'}</span>
                </div>
            </div>
            
            <table class="statement-table">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Ref</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Debit (KES)</th>
                        <th>Credit (KES)</th>
                        <th>Balance (KES)</th>
                    </tr>
                </thead>
                <tbody>
                    ${(statementData.statement || []).map((item, index) => {
                        // Handle special row types
                        if (item.type === 'term-header') {
                            return `
                                <tr style="background: linear-gradient(135deg, #00b32a 0%, #007a20 100%); color: white; font-weight: bold; box-shadow: 0 2px 8px rgba(0, 179, 42, 0.3);">
                                    <td colspan="7" style="text-align: center; padding: 18px; font-size: 18px; text-shadow: 0 1px 2px rgba(0,0,0,0.3); position: relative;">
                                        🏫 ${item.description || ''}
                                    </td>
                                </tr>
                            `;
                        } else if (item.type === 'term-closing') {
                            const termBalance = Number(item.termBalance) || 0;
                            const isOverpaid = termBalance < 0;
                            const isPaid = termBalance === 0;
                            
                            let balanceColor, textColor, statusIcon, statusText;
                            if (isOverpaid) {
                                balanceColor = '#d1f2eb';
                                textColor = '#00b32a';
                                statusIcon = '💚';
                                statusText = 'OVERPAID';
                            } else if (isPaid) {
                                balanceColor = '#d4edda';
                                textColor = '#155724';
                                statusIcon = '✅';
                                statusText = 'PAID';
                            } else {
                                balanceColor = '#fff3cd';
                                textColor = '#856404';
                                statusIcon = '⚠️';
                                statusText = 'OUTSTANDING';
                            }
                            
                            return `
                                <tr style="background: ${balanceColor}; border-left: 6px solid ${textColor}; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                    <td style="text-align: center; color: ${textColor}; font-size: 20px;">${statusIcon}</td>
                                    <td></td>
                                    <td></td>
                                    <td style="font-size: 16px; color: ${textColor}; display: flex; align-items: center; gap: 8px;">
                                        ${item.description || ''}
                                        <span style="background: ${textColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">${statusText}</span>
                                    </td>
                                    <td class="amount" style="color: ${textColor}; font-weight: bold;">${item.debit ? Number(item.debit).toLocaleString() : '-'}</td>
                                    <td class="amount" style="color: ${textColor}; font-weight: bold;">${item.credit ? Number(item.credit).toLocaleString() : '-'}</td>
                                    <td class="amount" style="font-size: 18px; color: ${textColor}; font-weight: bold;">${Math.abs(termBalance).toLocaleString()}</td>
                                </tr>
                            `;
                                                 } else if (item.type === 'brought-forward') {
                           const isOverpayment = item.isOverpayment;
                           const bgColor = isOverpayment ? '#d1f2eb' : '#fff3cd';
                           const textColor = isOverpayment ? '#00b32a' : '#856404';
                           const borderColor = isOverpayment ? '#00b32a' : '#ffc107';
                           const icon = isOverpayment ? '💚' : '📋';
                           
                           return `
                             <tr style="background: ${bgColor}; border-left: 6px solid ${borderColor}; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                               <td style="color: ${textColor}; text-align: center; font-size: 18px;">${icon}</td>
                               <td style="color: ${textColor}; font-family: monospace; font-weight: bold;">${item.ref || '-'}</td>
                               <td style="color: ${textColor}; font-weight: bold;">${item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                               <td style="color: ${textColor}; font-weight: bold;">${item.description || '-'}</td>
                               <td class="amount" style="color: ${textColor}; font-weight: bold;">${item.debit ? Number(item.debit).toLocaleString() : '-'}</td>
                               <td class="amount" style="color: ${textColor}; font-weight: bold;">${item.credit ? Number(item.credit).toLocaleString() : '-'}</td>
                               <td class="amount" style="color: ${textColor}; font-weight: bold; font-size: 16px;">${item.balance ? Number(item.balance).toLocaleString() : '-'}</td>
                             </tr>
                           `;
                         } else if (item.type === 'carry-forward') {
                           const carryForwardAmount = Number(item.termBalance) || 0;
                           const isOverpayment = carryForwardAmount < 0;
                           const bgColor = isOverpayment ? '#d1f2eb' : '#fff3cd';
                           const textColor = isOverpayment ? '#00b32a' : '#856404';
                           const borderColor = '#00b32a';
                           const statusText = isOverpayment ? 'CREDIT' : 'OUTSTANDING';
                           const icon = isOverpayment ? '🔄💚' : '🔄⚠️';
                           
                           return `
                             <tr style="background: ${bgColor}; border-left: 6px solid ${borderColor}; font-weight: bold; box-shadow: 0 2px 8px rgba(0,179,42,0.2);">
                               <td style="text-align: center; color: ${borderColor}; font-size: 16px;">${icon}</td>
                               <td style="color: ${borderColor}; font-family: monospace; font-weight: bold;">${item.ref || '-'}</td>
                               <td style="color: ${borderColor}; font-weight: bold;">${item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                               <td style="color: ${borderColor}; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                                 ${item.description || '-'}
                                 <span style="background: ${isOverpayment ? '#00b32a' : '#ffc107'}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">${statusText}</span>
                               </td>
                               <td class="amount" style="color: ${borderColor}; font-weight: bold;">${item.debit ? Number(item.debit).toLocaleString() : '-'}</td>
                               <td class="amount" style="color: ${borderColor}; font-weight: bold;">${item.credit ? Number(item.credit).toLocaleString() : '-'}</td>
                               <td class="amount" style="color: ${textColor}; font-weight: bold; font-size: 16px;">${Math.abs(carryForwardAmount).toLocaleString()}</td>
                             </tr>
                           `;
                        } else {
                            return `
                                <tr>
                                    <td>${item.no || index + 1}</td>
                                    <td>${item.ref || '-'}</td>
                                    <td>${item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                                    <td>${item.description || '-'}</td>
                                    <td class="amount debit">${item.debit ? Number(item.debit).toLocaleString() : '-'}</td>
                                    <td class="amount credit">${item.credit ? Number(item.credit).toLocaleString() : '-'}</td>
                                    <td class="amount">${item.balance ? Number(item.balance).toLocaleString() : '-'}</td>
                                </tr>
                            `;
                        }
                    }).join('')}
                </tbody>
            </table>
            
            <div class="summary">
                <h3>Financial Summary</h3>
                <div class="summary-item">
                    <span>Total Charges:</span>
                    <span class="debit">KES ${Number(statementData.summary?.totalDebit || 0).toLocaleString()}</span>
                </div>
                <div class="summary-item">
                    <span>Total Payments:</span>
                    <span class="credit">KES ${Number(statementData.summary?.totalCredit || 0).toLocaleString()}</span>
                </div>
                <div class="summary-item total">
                    <span>Final Balance:</span>
                    <span class="${Number(statementData.summary?.finalBalance || 0) >= 0 ? 'debit' : 'credit'}">
                        KES ${Number(statementData.summary?.finalBalance || 0).toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>${school.name} - Fee Statement | This document provides a complete academic year financial summary</p>
        </div>
    </div>
</body>
</html>
    `;

    // Return HTML page
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error viewing fee statement:', error);
    return NextResponse.json({ error: 'Failed to view fee statement' }, { status: 500 });
  }
}



