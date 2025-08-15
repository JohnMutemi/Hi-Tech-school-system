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
  balanceBefore: number
  balanceAfter: number
  description: string
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  try {
    // Import jsPDF dynamically to avoid SSR issues
    const { jsPDF } = await import('jspdf')
    
    // Create new PDF document
    const doc = new jsPDF()
    
    // Set font
    doc.setFont('helvetica')
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text(data.schoolName, 20, 30)
    
    doc.setFontSize(16)
    doc.setTextColor(100, 100, 100)
    doc.text('PAYMENT RECEIPT', 20, 45)
    
    // Receipt number and date
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    doc.text(`Receipt No: ${data.receiptNumber}`, 20, 60)
    doc.text(`Date: ${new Date(data.paymentDate).toLocaleDateString()}`, 20, 70)
    
    // Student details
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('Student Information', 20, 90)
    
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    doc.text(`Name: ${data.studentName}`, 20, 105)
    doc.text(`Student ID: ${data.studentId}`, 20, 115)
    doc.text(`Academic Year: ${data.academicYear}`, 20, 125)
    doc.text(`Term: ${data.term}`, 20, 135)
    
    // Payment details
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('Payment Details', 20, 155)
    
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    doc.text(`Description: ${data.description}`, 20, 170)
    doc.text(`Payment Method: ${data.paymentMethod}`, 20, 180)
    
    // Amount box
    doc.setFillColor(240, 248, 255)
    doc.rect(20, 190, 170, 30, 'F')
    doc.setFontSize(16)
    doc.setTextColor(40, 40, 40)
    doc.text(`Amount Paid: KES ${data.amount.toLocaleString()}`, 25, 210)
    
    // Balance information
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    doc.text(`Balance Before Payment: KES ${data.balanceBefore.toLocaleString()}`, 20, 235)
    doc.text(`Balance After Payment: KES ${data.balanceAfter.toLocaleString()}`, 20, 245)
    
    // Footer
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text('This is a computer-generated receipt. No signature required.', 20, 270)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 280)
    
    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer')
    return Buffer.from(pdfOutput)
    
  } catch (error) {
    console.error('Error generating PDF receipt:', error)
    
    // Fallback: create a simple text-based receipt
    const textReceipt = `
PAYMENT RECEIPT
${data.schoolName}

Receipt No: ${data.receiptNumber}
Date: ${new Date(data.paymentDate).toLocaleDateString()}

Student: ${data.studentName}
Student ID: ${data.studentId}
Academic Year: ${data.academicYear}
Term: ${data.term}

Payment Details:
Description: ${data.description}
Payment Method: ${data.paymentMethod}
Amount Paid: KES ${data.amount.toLocaleString()}

Balance Before: KES ${data.balanceBefore.toLocaleString()}
Balance After: KES ${data.balanceAfter.toLocaleString()}

Generated: ${new Date().toLocaleString()}
`
    
    return Buffer.from(textReceipt, 'utf-8')
  }
}






