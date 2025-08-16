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

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  try {
    console.log('Starting PDF generation with data:', JSON.stringify(data, null, 2))
    
    // Import jsPDF dynamically to avoid SSR issues
    const { jsPDF } = await import('jspdf')
    
    // Create new PDF document
    const doc = new jsPDF()
    
    // Set font
    doc.setFont('helvetica')
    
    // Header with gradient effect
    doc.setFillColor(59, 130, 246) // Blue gradient start
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.text(data.schoolName, 105, 20, { align: 'center' })
    
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.text('PAYMENT RECEIPT', 105, 32, { align: 'center' })
    
    // Receipt info section
    doc.setFillColor(248, 250, 252) // Light gray background
    doc.rect(10, 45, 190, 25, 'F')
    
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    doc.text(`Receipt No: ${data.receiptNumber}`, 15, 55)
    doc.text(`Date: ${new Date(data.paymentDate).toLocaleDateString()}`, 15, 65)
    doc.text(`School Code: ${data.schoolCode}`, 120, 55)
    doc.text(`Status: ${data.status || 'COMPLETED'}`, 120, 65)
    
    // Student details
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('Student Information', 15, 85)
    
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text(`Name: ${data.studentName}`, 15, 95)
    doc.text(`Admission No: ${data.admissionNumber || data.studentId}`, 15, 105)
    if (data.parentName) {
      doc.text(`Parent: ${data.parentName}`, 15, 115)
    }
    
    // Payment details
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('Payment Details', 15, 135)
    
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text(`Amount Paid: ${data.currency || 'KES'} ${data.amount.toLocaleString()}`, 15, 145)
    doc.text(`Payment Method: ${data.paymentMethod}`, 15, 155)
    doc.text(`Fee Type: ${data.description}`, 15, 165)
    doc.text(`Term: ${data.term}`, 15, 175)
    doc.text(`Academic Year: ${data.academicYear}`, 15, 185)
    if (data.reference) {
      doc.text(`Reference: ${data.reference}`, 15, 195)
    }
    
    // Balance information
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('Balance Information', 15, 215)
    
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text(`Term Balance (Before): ${data.currency || 'KES'} ${data.termOutstandingBefore?.toLocaleString() || data.balanceBefore.toLocaleString()}`, 15, 225)
    doc.text(`Term Balance (After): ${data.currency || 'KES'} ${data.termOutstandingAfter?.toLocaleString() || data.balanceAfter.toLocaleString()}`, 15, 235)
    doc.text(`Academic Year Balance (Before): ${data.currency || 'KES'} ${data.academicYearOutstandingBefore?.toLocaleString() || data.balanceBefore.toLocaleString()}`, 15, 245)
    doc.text(`Academic Year Balance (After): ${data.currency || 'KES'} ${data.academicYearOutstandingAfter?.toLocaleString() || data.balanceAfter.toLocaleString()}`, 15, 255)
    
    // Footer
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(`Issued by: ${data.issuedBy || 'Bursar'}`, 15, 275)
    doc.text('Processed through: Bursar Portal', 15, 285)
    doc.text('This is a computer-generated receipt and does not require a signature.', 15, 295)
    
    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer')
    console.log('PDF generated successfully with enhanced format')
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






