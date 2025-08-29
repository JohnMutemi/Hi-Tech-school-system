interface ReceiptData {
  receiptNumber: string
  studentName: string
  studentId: string
  amount: number
  paymentDate: Date
  paymentMethod: string
  academicYear: string
  term: string
  schoolName: string
  schoolCode: string
  balanceBefore: number
  balanceAfter: number
  description: string
  admissionNumber?: string
  parentName?: string
  currency?: string
  status?: string
  issuedBy?: string
  reference?: string
  phoneNumber?: string
  transactionId?: string
  termOutstandingBefore?: number
  termOutstandingAfter?: number
  academicYearOutstandingBefore?: number
  academicYearOutstandingAfter?: number
  carryForward?: number
}

function convertNumberToWords(amount: number): string {
  if (amount === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Million', 'Billion'];

  function convertHundreds(num: number): string {
    let result = '';
    
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + ' ';
      return result;
    }
    
    if (num > 0) {
      result += ones[num] + ' ';
    }
    
    return result;
  }

  let result = '';
  let thousandCounter = 0;
  
  while (amount > 0) {
    if (amount % 1000 !== 0) {
      result = convertHundreds(amount % 1000) + thousands[thousandCounter] + ' ' + result;
    }
    amount = Math.floor(amount / 1000);
    thousandCounter++;
  }
  
  return result.trim();
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  try {
    console.log('Starting PDF generation with commercial aesthetic:', JSON.stringify(data, null, 2))
    
    // Import jsPDF dynamically to avoid SSR issues
    const { jsPDF } = await import('jspdf')
    
    // Create new PDF document
    const doc = new jsPDF()
    
    // Set font
    doc.setFont('helvetica')
    
    // Premium Header with enhanced design
    doc.setFillColor(29, 78, 216) // Deeper blue header
    doc.rect(0, 0, 210, 45, 'F')
    
    // Add subtle gradient effect with overlays
    doc.setFillColor(59, 130, 246, 0.3)
    doc.rect(0, 0, 210, 15, 'F')
    
    // School logo placeholder (circle)
    doc.setFillColor(255, 255, 255, 0.2)
    doc.circle(25, 22, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text('🏫', 22, 25)
    
    // School name and tagline
    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.text(data.schoolName, 40, 18)
    
    doc.setFontSize(8)
    doc.setTextColor(191, 219, 254) // Light blue
    doc.text('Excellence in Education', 40, 25)
    
    // Contact information with icons
    doc.setFontSize(7)
    doc.text(`📧 ${data.schoolCode.toLowerCase()}@school.ac.ke`, 40, 32)
    doc.text(`📞 +254-XXX-XXXXXX`, 40, 36)
    
    // Enhanced Date and Receipt boxes (right side)
    // Date box with shadow effect
    doc.setFillColor(255, 255, 255, 0.95)
    doc.rect(140, 8, 55, 12, 'F')
    doc.setDrawColor(255, 255, 255, 0.5)
    doc.rect(140, 8, 55, 12, 'D')
    doc.setTextColor(29, 78, 216)
    doc.setFontSize(7)
    doc.text('DATE', 142, 13)
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text(new Date(data.paymentDate).toLocaleDateString(), 142, 17)
    
    // Receipt number box with gradient
    doc.setFillColor(251, 191, 36) // Amber
    doc.rect(140, 22, 55, 12, 'F')
    doc.setDrawColor(245, 158, 11)
    doc.rect(140, 22, 55, 12, 'D')
    doc.setTextColor(120, 53, 15) // Amber-900
    doc.setFontSize(7)
    doc.text('RECEIPT NO', 142, 27)
    doc.setFontSize(8)
    doc.text(data.receiptNumber, 142, 31)
    
    // Invoice/Receipt label
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 35, 210, 12, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text('MONEY RECEIPT', 105, 43, { align: 'center' })
    
    // Enhanced Customer Information Section
    let yPos = 60
    doc.setTextColor(0, 0, 0)
    
    // Background gradient for customer section
    doc.setFillColor(248, 250, 252)
    doc.rect(15, yPos, 180, 35, 'F')
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(2)
    doc.line(15, yPos, 195, yPos)
    
    yPos += 5
    
    // Student Name box with icon
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(1)
    doc.rect(20, yPos, 170, 12, 'FD')
    
    // Icon circle for name
    doc.setFillColor(239, 246, 255)
    doc.circle(25, yPos + 6, 3, 'F')
    doc.setTextColor(37, 99, 235)
    doc.setFontSize(8)
    doc.text('👤', 23.5, yPos + 7)
    
    doc.setTextColor(37, 99, 235)
    doc.setFontSize(8)
    doc.text('STUDENT NAME:', 32, yPos + 4)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.text(data.studentName, 32, yPos + 9)
    
    yPos += 15
    
    // Admission number box with icon
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(59, 130, 246)
    doc.rect(20, yPos, 170, 12, 'FD')
    
    // Icon circle for admission
    doc.setFillColor(239, 246, 255)
    doc.circle(25, yPos + 6, 3, 'F')
    doc.setTextColor(37, 99, 235)
    doc.setFontSize(8)
    doc.text('🆔', 23.5, yPos + 7)
    
    doc.setTextColor(37, 99, 235)
    doc.setFontSize(8)
    doc.text('ADMISSION NO:', 32, yPos + 4)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.text(`${data.admissionNumber || data.studentId}`, 32, yPos + 9)
    
    if (data.parentName) {
      doc.setFontSize(8)
      doc.setTextColor(59, 130, 246)
      doc.text(`Parent/Guardian: ${data.parentName}`, 32, yPos + 11)
    }
    
    // Table Header
    yPos += 25
    doc.setFillColor(37, 99, 235)
    doc.setDrawColor(29, 78, 216)
    
    // Table header row
    const tableStartY = yPos
    doc.rect(15, yPos, 20, 10, 'FD')  // NO
    doc.rect(35, yPos, 80, 10, 'FD')  // DESCRIPTION
    doc.rect(115, yPos, 20, 10, 'FD') // QTY
    doc.rect(135, yPos, 30, 10, 'FD') // UNIT PRICE
    doc.rect(165, yPos, 30, 10, 'FD') // AMOUNT
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text('NO.', 25, yPos + 6, { align: 'center' })
    doc.text('DESCRIPTION', 75, yPos + 6, { align: 'center' })
    doc.text('QTY', 125, yPos + 6, { align: 'center' })
    doc.text('UNIT PRICE', 150, yPos + 6, { align: 'center' })
    doc.text('AMOUNT', 180, yPos + 6, { align: 'center' })
    
    // Table rows
    yPos += 10
    doc.setTextColor(0, 0, 0)
    doc.setDrawColor(200, 200, 200)
    
    // Main payment row
    const rowHeight = 15
    doc.rect(15, yPos, 20, rowHeight, 'D')
    doc.rect(35, yPos, 80, rowHeight, 'D')
    doc.rect(115, yPos, 20, rowHeight, 'D')
    doc.rect(135, yPos, 30, rowHeight, 'D')
    doc.rect(165, yPos, 30, rowHeight, 'D')
    
    doc.setFontSize(9)
    doc.text('1', 25, yPos + 6, { align: 'center' })
    doc.text(data.description || 'School Fees', 37, yPos + 6)
    doc.setFontSize(7)
    doc.text(`${data.academicYear} - ${data.term}`, 37, yPos + 10)
    doc.text(`Payment: ${data.paymentMethod}`, 37, yPos + 13)
    doc.setFontSize(9)
    doc.text('1', 125, yPos + 6, { align: 'center' })
    doc.text(`${data.currency || 'KES'} ${data.amount.toLocaleString()}`, 150, yPos + 6, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`${data.currency || 'KES'} ${data.amount.toLocaleString()}`, 180, yPos + 6, { align: 'center' })
    
    yPos += rowHeight
    
    // Balance information row (if available)
    if (data.termOutstandingBefore !== undefined || data.academicYearOutstandingBefore !== undefined) {
      doc.setFillColor(248, 250, 252)
      doc.rect(15, yPos, 20, rowHeight, 'FD')
      doc.rect(35, yPos, 80, rowHeight, 'FD')
      doc.rect(115, yPos, 20, rowHeight, 'FD')
      doc.rect(135, yPos, 30, rowHeight, 'FD')
      doc.rect(165, yPos, 30, rowHeight, 'FD')
      
      doc.setFontSize(9)
      doc.text('2', 25, yPos + 6, { align: 'center' })
      doc.text('Account Balance Summary', 37, yPos + 6)
      doc.setFontSize(7)
      if (data.termOutstandingBefore !== undefined) {
        doc.text(`Term: ${data.currency || 'KES'} ${data.termOutstandingBefore.toLocaleString()} → ${data.currency || 'KES'} ${data.termOutstandingAfter?.toLocaleString() || '0'}`, 37, yPos + 10)
      }
      if (data.academicYearOutstandingBefore !== undefined) {
        doc.text(`Year: ${data.currency || 'KES'} ${data.academicYearOutstandingBefore.toLocaleString()} → ${data.currency || 'KES'} ${data.academicYearOutstandingAfter?.toLocaleString() || '0'}`, 37, yPos + 13)
      }
      doc.setFontSize(9)
      doc.text('-', 125, yPos + 6, { align: 'center' })
      doc.text('-', 150, yPos + 6, { align: 'center' })
      doc.text('-', 180, yPos + 6, { align: 'center' })
      
      yPos += rowHeight
    }
    
    // Carry forward row (if available)
    if (data.carryForward && data.carryForward > 0) {
      doc.setFillColor(239, 246, 255)
      doc.rect(15, yPos, 20, rowHeight, 'FD')
      doc.rect(35, yPos, 80, rowHeight, 'FD')
      doc.rect(115, yPos, 20, rowHeight, 'FD')
      doc.rect(135, yPos, 30, rowHeight, 'FD')
      doc.rect(165, yPos, 30, rowHeight, 'FD')
      
      doc.setFontSize(9)
      doc.setTextColor(37, 99, 235)
      doc.text('3', 25, yPos + 6, { align: 'center' })
      doc.text('Overpayment Carried Forward', 37, yPos + 6)
      doc.setFontSize(7)
      doc.text('Applied to next term fees', 37, yPos + 10)
      doc.setFontSize(9)
      doc.text('1', 125, yPos + 6, { align: 'center' })
      doc.text(`${data.currency || 'KES'} ${data.carryForward.toLocaleString()}`, 150, yPos + 6, { align: 'center' })
      doc.text(`${data.currency || 'KES'} ${data.carryForward.toLocaleString()}`, 180, yPos + 6, { align: 'center' })
      
      yPos += rowHeight
      doc.setTextColor(0, 0, 0)
    }
    
    // Empty rows for professional look
    for (let i = 0; i < 3; i++) {
      doc.rect(15, yPos, 20, 8, 'D')
      doc.rect(35, yPos, 80, 8, 'D')
      doc.rect(115, yPos, 20, 8, 'D')
      doc.rect(135, yPos, 30, 8, 'D')
      doc.rect(165, yPos, 30, 8, 'D')
      yPos += 8
    }
    
    // Terms and Total Section
    yPos += 5
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(1)
    doc.line(15, yPos, 195, yPos)
    
    // Terms section
    yPos += 5
    doc.setFontSize(8)
    doc.text('TERMS & CONDITIONS:', 15, yPos)
    doc.setFontSize(7)
    doc.text('Payment received in good condition', 15, yPos + 5)
    doc.text('No refund of money after payment', 15, yPos + 9)
    doc.setFontSize(8)
    doc.text('Thanks for your patronage.', 15, yPos + 15)
    
    // Total section
    doc.setFillColor(220, 38, 38) // Red background for total
    doc.rect(130, yPos, 65, 12, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.text(`TOTAL ${data.currency || 'KES'} ${data.amount.toLocaleString()}`, 162, yPos + 8, { align: 'center' })
    
    // Amount in words
    yPos += 20
    doc.setTextColor(0, 0, 0)
    doc.setFillColor(248, 250, 252)
    doc.rect(15, yPos, 180, 15, 'FD')
    doc.setFontSize(8)
    doc.text('Amount in words:', 18, yPos + 5)
    doc.setFontSize(9)
    const amountInWords = convertNumberToWords(data.amount)
    doc.text(`${amountInWords} ${data.currency || 'Kenyan Shillings'} Only`, 18, yPos + 10)
    
    // Signatures section
    yPos += 25
    doc.setFontSize(9)
    doc.text("Soft's signature", 30, yPos + 10, { align: 'center' })
    doc.line(15, yPos + 5, 60, yPos + 5)
    
    // Thanks message
    doc.setFillColor(37, 99, 235)
    doc.rect(130, yPos - 5, 65, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('Thanks For Your Patronage!', 162, yPos + 1, { align: 'center' })
    
    doc.setTextColor(0, 0, 0)
    doc.text("Customer's signature", 162, yPos + 10, { align: 'center' })
    doc.line(130, yPos + 5, 195, yPos + 5)
    
    // Reference information
    yPos += 20
    if (data.reference || data.transactionId || data.studentId) {
      doc.setFillColor(248, 250, 252)
      doc.rect(15, yPos, 180, 15, 'F')
      doc.setFontSize(7)
      doc.setTextColor(80, 80, 80)
      let refY = yPos + 5
      if (data.studentId) {
        doc.text(`Payment ID: ${data.studentId}`, 18, refY)
        refY += 4
      }
      if (data.transactionId) {
        doc.text(`Transaction ID: ${data.transactionId}`, 18, refY)
        refY += 4
      }
      if (data.reference) {
        doc.text(`Reference: ${data.reference}`, 18, refY)
      }
      doc.text(`Issued by: ${data.issuedBy || 'Bursar'} | Generated: ${new Date().toLocaleDateString()}`, 105, yPos + 12, { align: 'center' })
    }
    
    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer')
    console.log('PDF generated successfully with commercial aesthetic')
    return Buffer.from(pdfOutput)
    
  } catch (error) {
    console.error('Error generating PDF receipt:', error)
    console.log('Falling back to text-based receipt format')
    
    // Fallback: create a simple text-based receipt
    const textReceipt = `
PAYMENT RECEIPT
${data.schoolName}
School Code: ${data.schoolCode}

Receipt Information
Receipt Number: ${data.receiptNumber}
Payment ID: ${data.studentId}
Date & Time: ${new Date(data.paymentDate).toLocaleDateString()}
Status: ${data.status || 'COMPLETED'}

Student Information
Student Name: ${data.studentName}
Admission Number: ${data.admissionNumber || data.studentId}
Parent Name: ${data.parentName || 'N/A'}

Payment Details
Amount Paid: ${data.currency || 'KES'} ${data.amount.toLocaleString()}
Payment Method: ${data.paymentMethod}
Fee Type: ${data.description}
Term: ${data.term}
Academic Year: ${data.academicYear}
Reference: ${data.reference || 'N/A'}

Balance Information
Term Balance (Before): ${data.currency || 'KES'} ${data.termOutstandingBefore?.toLocaleString() || data.balanceBefore.toLocaleString()}
Term Balance (After): ${data.currency || 'KES'} ${data.termOutstandingAfter?.toLocaleString() || data.balanceAfter.toLocaleString()}
Academic Year Balance (Before): ${data.currency || 'KES'} ${data.academicYearOutstandingBefore?.toLocaleString() || data.balanceBefore.toLocaleString()}
Academic Year Balance (After): ${data.currency || 'KES'} ${data.academicYearOutstandingAfter?.toLocaleString() || data.balanceAfter.toLocaleString()}

Issued by: ${data.issuedBy || 'Bursar'}
Processed through: Bursar Portal
This is a computer-generated receipt and does not require a signature.
`
    
    return Buffer.from(textReceipt, 'utf-8')
  }
}






