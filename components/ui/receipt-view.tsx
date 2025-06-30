import { Button } from "./button"
import { Card } from "./card"
import { Receipt, Printer, Download } from "lucide-react"
import { Payment } from "@/lib/types/fees"

interface ReceiptViewProps {
  receipt: Payment
  studentName: string
  studentClass: string
  admissionNumber: string
  schoolName: string
  onClose: () => void
}

export function ReceiptView({
  receipt,
  studentName,
  studentClass,
  admissionNumber,
  schoolName,
  onClose,
}: ReceiptViewProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Create a printable version of the receipt
    const receiptContent = `
FEES PAYMENT RECEIPT
===================
Receipt No: ${receipt.receiptNumber}
Date: ${receipt.paymentDate}
Student Name: ${studentName}
Admission No: ${admissionNumber}
Class: ${studentClass}
Amount Paid: ${receipt.amount.toFixed(2)}
Payment Method: ${receipt.paymentMethod}
Received By: ${receipt.receivedBy}
Reference Number: ${receipt.referenceNumber || 'N/A'}
Description: ${receipt.description}
    `.trim()

    // Create and trigger download
    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Receipt-${receipt.receiptNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <Card className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative border-2 border-green-200">
        <button 
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500" 
          onClick={onClose}
        >
          &times;
        </button>
        
        <div className="flex flex-col items-center mb-4">
          <h2 className="text-2xl font-bold text-green-700 mb-2 flex items-center gap-2">
            <Receipt className="w-6 h-6" /> Fees Payment Receipt
          </h2>
          <div className="text-gray-600">{schoolName}</div>
          <div className="text-gray-600 mb-2">Official Receipt</div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><strong>Receipt No:</strong> {receipt.receiptNumber}</div>
          <div><strong>Date:</strong> {new Date(receipt.paymentDate).toLocaleDateString()}</div>
          <div><strong>Student Name:</strong> {studentName}</div>
          <div><strong>Admission No:</strong> {admissionNumber}</div>
          <div><strong>Class:</strong> {studentClass}</div>
          <div><strong>Amount Paid:</strong> {receipt.amount.toFixed(2)}</div>
          {typeof receipt.balance !== 'undefined' && (
            <div><strong>Balance after payment:</strong> {receipt.balance.toLocaleString()}</div>
          )}
          <div><strong>Payment Method:</strong> {receipt.paymentMethod}</div>
          <div><strong>Received By:</strong> {receipt.receivedBy}</div>
          {receipt.referenceNumber && (
            <div><strong>Reference No:</strong> {receipt.referenceNumber}</div>
          )}
          <div className="col-span-2"><strong>Description:</strong> {receipt.description}</div>
        </div>

        <div className="mt-8 text-xs text-gray-500 text-center">
          This is a computer generated receipt and does not require a physical signature.
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-5 h-5 mr-2" /> Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-5 h-5 mr-2" /> Download
          </Button>
        </div>
      </Card>
    </div>
  )
} 