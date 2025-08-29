interface EnhancedReceiptData {
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

export async function generateEnhancedReceiptPDF(data: EnhancedReceiptData, size: 'A3' | 'A4' | 'A5' = 'A4'): Promise<Buffer> {
  // Import jsPDF dynamically to avoid SSR issues
  const { jsPDF } = await import('jspdf')
  
  // Define paper sizes in mm for jsPDF
  const paperSizes = {
    A3: { width: 297, height: 420 },
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 }
  }
  
  const currentSize = paperSizes[size]
  
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${data.currency || 'KES'} 0`;
    }
    return `${data.currency || 'KES'} ${amount.toLocaleString()}`;
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) {
      return 'N/A';
    }
    try {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Create PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [currentSize.width, currentSize.height]
  })

  const pageWidth = currentSize.width
  const pageHeight = currentSize.height
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)
  
  // Set font
  pdf.setFont('helvetica')
  
  let yPosition = margin

  // Header Section with Blue Background
  pdf.setFillColor(30, 64, 175) // Blue background
  pdf.rect(0, 0, pageWidth, 80, 'F')
  
  // School Name
  pdf.setTextColor(255, 255, 255) // White text
  pdf.setFontSize(size === 'A5' ? 18 : size === 'A3' ? 32 : 24)
  pdf.setFont('helvetica', 'bold')
  const schoolNameWidth = pdf.getTextWidth(data.schoolName)
  pdf.text(data.schoolName, (pageWidth - schoolNameWidth) / 2, 25)
  
  // School Subtitle
  pdf.setFontSize(size === 'A5' ? 10 : size === 'A3' ? 16 : 12)
  pdf.setFont('helvetica', 'normal')
  const subtitleWidth = pdf.getTextWidth('Excellence in Education')
  pdf.text('Excellence in Education', (pageWidth - subtitleWidth) / 2, 35)
  
  // Receipt Title
  pdf.setFillColor(251, 191, 36) // Yellow background
  pdf.setTextColor(146, 64, 14) // Brown text
  pdf.setFontSize(size === 'A5' ? 14 : size === 'A3' ? 20 : 16)
  pdf.setFont('helvetica', 'bold')
  const titleText = 'PAYMENT RECEIPT'
  const titleWidth = pdf.getTextWidth(titleText)
  const titleX = (pageWidth - titleWidth) / 2 - 10
  pdf.roundedRect(titleX, 45, titleWidth + 20, 12, 3, 3, 'F')
  pdf.text(titleText, (pageWidth - titleWidth) / 2, 53)
  
  yPosition = 90

  // Receipt Number and Date Section
  pdf.setTextColor(0, 0, 0) // Black text
  pdf.setFillColor(248, 250, 252) // Light gray background
  pdf.rect(0, yPosition, pageWidth, 25, 'F')
  
  // Receipt Number
  pdf.setFontSize(size === 'A5' ? 10 : size === 'A3' ? 16 : 12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('RECEIPT NO:', margin, yPosition + 8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(data.receiptNumber, margin + 35, yPosition + 8)
  
  // Date
  pdf.setFont('helvetica', 'bold')
  pdf.text('DATE:', margin, yPosition + 18)
  pdf.setFont('helvetica', 'normal')
  pdf.text(formatDate(data.paymentDate), margin + 20, yPosition + 18)
  
  // Payment For (right side)
  pdf.setFont('helvetica', 'bold')
  const paymentForX = pageWidth - margin - 80
  pdf.text('PAYMENT FOR:', paymentForX, yPosition + 8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(data.description || 'School Fees', paymentForX, yPosition + 18)
  
  yPosition += 35

  // Student Information Section
  pdf.setFontSize(size === 'A5' ? 12 : size === 'A3' ? 18 : 14)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(30, 64, 175) // Blue text
  pdf.text('RECEIVED FROM', margin, yPosition)
  
  yPosition += 10
  pdf.setDrawColor(229, 231, 235) // Light gray
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8
  
  pdf.setTextColor(0, 0, 0) // Black text
  pdf.setFontSize(size === 'A5' ? 9 : size === 'A3' ? 14 : 11)
  
  // Student info in two columns
  const col1X = margin
  const col2X = pageWidth / 2
  
  pdf.setFont('helvetica', 'bold')
  pdf.text('Student Name:', col1X, yPosition)
  pdf.setFont('helvetica', 'normal')
  pdf.text(data.studentName, col1X, yPosition + 8)
  
  pdf.setFont('helvetica', 'bold')
  pdf.text('Admission No:', col2X, yPosition)
  pdf.setFont('helvetica', 'normal')
  pdf.text(data.admissionNumber || 'N/A', col2X, yPosition + 8)
  
  yPosition += 18
  
  if (data.parentName) {
    pdf.setFont('helvetica', 'bold')
    pdf.text('Parent/Guardian:', col1X, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.text(data.parentName, col1X, yPosition + 8)
    yPosition += 16
  }

  yPosition += 10

  // Payment Details Section
  pdf.setFontSize(size === 'A5' ? 12 : size === 'A3' ? 18 : 14)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(30, 64, 175) // Blue text
  pdf.text('PAYMENT DETAILS', margin, yPosition)
  
  yPosition += 10
  pdf.setDrawColor(229, 231, 235) // Light gray
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8
  
  pdf.setTextColor(0, 0, 0) // Black text
  pdf.setFontSize(size === 'A5' ? 9 : size === 'A3' ? 14 : 11)
  
  // Payment details in two columns
  pdf.setFont('helvetica', 'bold')
  pdf.text('Description:', col1X, yPosition)
  pdf.setFont('helvetica', 'normal')
  pdf.text(data.description || 'School Fees', col1X, yPosition + 8)
  
  pdf.setFont('helvetica', 'bold')
  pdf.text('Payment Method:', col2X, yPosition)
  pdf.setFont('helvetica', 'normal')
  const paymentMethod = (data.paymentMethod || 'manual').replace('_', ' ')
  pdf.text(paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1), col2X, yPosition + 8)
  
  yPosition += 18
  
  pdf.setFont('helvetica', 'bold')
  pdf.text('Term:', col1X, yPosition)
  pdf.setFont('helvetica', 'normal')
  pdf.text(data.term, col1X, yPosition + 8)
  
  pdf.setFont('helvetica', 'bold')
  pdf.text('Academic Year:', col2X, yPosition)
  pdf.setFont('helvetica', 'normal')
  pdf.text(data.academicYear, col2X, yPosition + 8)
  
  yPosition += 18

  if (data.reference && data.reference !== 'N/A') {
    pdf.setFont('helvetica', 'bold')
    pdf.text('Reference Number:', col1X, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.text(data.reference, col1X, yPosition + 8)
    yPosition += 16
  }

  yPosition += 10

  // Payment Summary Section with Blue Background
  pdf.setFillColor(240, 249, 255) // Light blue background
  pdf.setDrawColor(14, 165, 233) // Blue border
  pdf.rect(margin, yPosition, contentWidth, 40, 'FD')
  
  yPosition += 8
  pdf.setFontSize(size === 'A5' ? 12 : size === 'A3' ? 18 : 14)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(12, 74, 110) // Dark blue text
  const summaryTitle = 'PAYMENT SUMMARY'
  const summaryTitleWidth = pdf.getTextWidth(summaryTitle)
  pdf.text(summaryTitle, (pageWidth - summaryTitleWidth) / 2, yPosition + 5)
  
  yPosition += 15
  pdf.setFontSize(size === 'A5' ? 11 : size === 'A3' ? 16 : 13)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0) // Black text
  
  // Total Amount
  const totalText = 'TOTAL AMOUNT PAID:'
  const amountText = formatCurrency(data.amount)
  const totalTextWidth = pdf.getTextWidth(totalText)
  const amountTextWidth = pdf.getTextWidth(amountText)
  
  pdf.text(totalText, margin + 10, yPosition + 5)
  pdf.setTextColor(5, 150, 105) // Green text
  pdf.text(amountText, pageWidth - margin - amountTextWidth - 10, yPosition + 5)
  
  yPosition += 20

  // Account Balance Section (if available)
  if (data.academicYearOutstandingBefore !== undefined || data.academicYearOutstandingAfter !== undefined) {
    yPosition += 10
    
    pdf.setFillColor(254, 243, 199) // Light yellow background
    pdf.setDrawColor(245, 158, 11) // Orange border
    pdf.rect(margin, yPosition, contentWidth, 35, 'FD')
    
    yPosition += 8
    pdf.setFontSize(size === 'A5' ? 12 : size === 'A3' ? 18 : 14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(146, 64, 14) // Brown text
    const balanceTitle = 'ACCOUNT BALANCE SUMMARY'
    const balanceTitleWidth = pdf.getTextWidth(balanceTitle)
    pdf.text(balanceTitle, (pageWidth - balanceTitleWidth) / 2, yPosition + 5)
    
    yPosition += 15
    pdf.setFontSize(size === 'A5' ? 9 : size === 'A3' ? 14 : 11)
    pdf.setTextColor(0, 0, 0) // Black text
    
    if (data.academicYearOutstandingBefore !== undefined) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Outstanding Before:', col1X + 5, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(formatCurrency(data.academicYearOutstandingBefore), col1X + 5, yPosition + 8)
    }
    
    if (data.academicYearOutstandingAfter !== undefined) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Outstanding After:', col2X, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(formatCurrency(data.academicYearOutstandingAfter), col2X, yPosition + 8)
    }
    
    yPosition += 25
  }

  // Footer Section
  yPosition = pageHeight - 40
  pdf.setFillColor(248, 250, 252) // Light gray background
  pdf.rect(0, yPosition, pageWidth, 40, 'F')
  
  yPosition += 10
  pdf.setFontSize(size === 'A5' ? 8 : size === 'A3' ? 12 : 10)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(107, 114, 128) // Gray text
  
  const footerText1 = 'This is a computer-generated receipt and does not require a signature.'
  const footerText2 = 'Thank you for your payment. For any queries, please contact the school administration.'
  
  const footerText1Width = pdf.getTextWidth(footerText1)
  const footerText2Width = pdf.getTextWidth(footerText2)
  
  pdf.text(footerText1, (pageWidth - footerText1Width) / 2, yPosition + 5)
  pdf.text(footerText2, (pageWidth - footerText2Width) / 2, yPosition + 12)
  
  // Signature section
  yPosition += 20
  const signatureX = pageWidth - margin - 60
  pdf.setDrawColor(209, 213, 219) // Gray line
  pdf.line(signatureX, yPosition, pageWidth - margin, yPosition)
  
  yPosition += 5
  pdf.setFontSize(size === 'A5' ? 8 : size === 'A3' ? 12 : 10)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(75, 85, 99) // Dark gray
  const issuedByText = data.issuedBy || 'School System'
  const issuedByWidth = pdf.getTextWidth(issuedByText)
  pdf.text(issuedByText, pageWidth - margin - issuedByWidth, yPosition + 3)
  
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(size === 'A5' ? 7 : size === 'A3' ? 10 : 8)
  const receiverText = 'Money Receiver'
  const receiverWidth = pdf.getTextWidth(receiverText)
  pdf.text(receiverText, pageWidth - margin - receiverWidth, yPosition + 8)

  // Generate PDF buffer
  const pdfOutput = pdf.output('arraybuffer')
  return Buffer.from(pdfOutput)
}